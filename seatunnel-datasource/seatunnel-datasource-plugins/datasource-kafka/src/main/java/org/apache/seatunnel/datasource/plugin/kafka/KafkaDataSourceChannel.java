/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.seatunnel.datasource.plugin.kafka;

import org.apache.seatunnel.api.configuration.util.OptionRule;
import org.apache.seatunnel.datasource.plugin.api.DataSourceChannel;
import org.apache.seatunnel.datasource.plugin.api.DataSourcePluginException;
import org.apache.seatunnel.datasource.plugin.api.model.TableField;
import org.apache.seatunnel.datasource.plugin.api.utils.JsonSchemaDerivationUtils;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.DescribeClusterOptions;
import org.apache.kafka.clients.admin.DescribeClusterResult;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;

import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.UUID;

import static com.google.common.base.Preconditions.checkArgument;

@Slf4j
public class KafkaDataSourceChannel implements DataSourceChannel {

    private static final String DATABASE = "default";
    private static final DescribeClusterOptions DEFAULT_TIMEOUT_OPTIONS =
            new DescribeClusterOptions().timeoutMs(60 * 1000);

    @Override
    public OptionRule getDataSourceOptions(@NonNull String pluginName) {
        return KafkaOptionRule.optionRule();
    }

    @Override
    public OptionRule getDatasourceMetadataFieldsByDataSourceName(@NonNull String pluginName) {
        return KafkaOptionRule.metadataRule();
    }

    @Override
    public List<String> getTables(
            @NonNull String pluginName,
            Map<String, String> requestParams,
            String database,
            Map<String, String> option) {
        checkArgument(StringUtils.equalsIgnoreCase(database, DATABASE), "database must be default");
        try (AdminClient adminClient = createAdminClient(requestParams)) {
            Set<String> strings = adminClient.listTopics().names().get();
            return new ArrayList<>(strings);
        } catch (Exception ex) {
            throw new DataSourcePluginException(
                    "check kafka connectivity failed, " + ex.getMessage(), ex);
        }
    }

    @Override
    public List<String> getDatabases(
            @NonNull String pluginName, @NonNull Map<String, String> requestParams) {
        return DEFAULT_DATABASES;
    }

    @Override
    public boolean checkDataSourceConnectivity(
            @NonNull String pluginName, @NonNull Map<String, String> requestParams) {
        try (AdminClient adminClient = createAdminClient(requestParams)) {
            // just test the connection
            DescribeClusterResult describeClusterResult =
                    adminClient.describeCluster(DEFAULT_TIMEOUT_OPTIONS);
            return CollectionUtils.isNotEmpty(describeClusterResult.nodes().get());
        } catch (Exception ex) {
            throw new DataSourcePluginException(
                    "check kafka connectivity failed, " + ex.getMessage(), ex);
        }
    }

    @Override
    public boolean canAbleGetSchema() {
        return true;
    }

    @Override
    public Map<String, Object> previewMessage(
            @NonNull String pluginName,
            @NonNull Map<String, String> requestParams,
            @NonNull String database,
            @NonNull String table,
            Long offset) {
        checkArgument(StringUtils.equalsIgnoreCase(database, DATABASE), "database must be default");
        Properties props = KafkaRequestParamsUtils.parsePropertiesFromRequestParams(requestParams);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(
                ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "seatunnel-schema-preview-" + UUID.randomUUID());
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, "1");

        try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props)) {
            TopicPartition tp = new TopicPartition(table, 0);
            consumer.assign(Collections.singletonList(tp));
            if (offset != null && offset >= 0) {
                consumer.seek(tp, offset);
            }
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(10));
            if (!records.isEmpty()) {
                ConsumerRecord<String, String> record = records.iterator().next();
                Map<String, Object> result = new HashMap<>();
                result.put("value", record.value());
                result.put("offset", record.offset());
                result.put("partition", record.partition());
                return result;
            }
            return Collections.emptyMap();
        } catch (Exception e) {
            throw new DataSourcePluginException(
                    "Failed to preview message from topic: " + table + ", " + e.getMessage(), e);
        }
    }

    @Override
    public List<TableField> getTableFields(
            @NonNull String pluginName,
            @NonNull Map<String, String> requestParams,
            @NonNull String database,
            @NonNull String table) {
        checkArgument(StringUtils.equalsIgnoreCase(database, DATABASE), "database must be default");
        Properties props = KafkaRequestParamsUtils.parsePropertiesFromRequestParams(requestParams);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(
                ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(
                ConsumerConfig.GROUP_ID_CONFIG, "seatunnel-schema-derivation-" + UUID.randomUUID());
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, "1");

        try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props)) {
            consumer.subscribe(Collections.singletonList(table));
            long deadline = System.currentTimeMillis() + 15_000;
            while (System.currentTimeMillis() < deadline) {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(5));
                for (ConsumerRecord<String, String> record : records) {
                    String value = record.value();
                    if (value != null && !value.trim().isEmpty()) {
                        return JsonSchemaDerivationUtils.deriveFromJson(value);
                    }
                }
            }
            throw new DataSourcePluginException("No valid JSON message found in topic: " + table);
        } catch (DataSourcePluginException e) {
            throw e;
        } catch (Exception e) {
            throw new DataSourcePluginException(
                    "Failed to derive schema from topic: " + table + ", " + e.getMessage(), e);
        }
    }

    private AdminClient createAdminClient(Map<String, String> requestParams) {
        return AdminClient.create(
                KafkaRequestParamsUtils.parsePropertiesFromRequestParams(requestParams));
    }
}
