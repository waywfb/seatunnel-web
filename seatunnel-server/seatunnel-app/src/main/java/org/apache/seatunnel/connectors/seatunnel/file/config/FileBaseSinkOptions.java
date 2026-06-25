package org.apache.seatunnel.connectors.seatunnel.file.config;

import org.apache.seatunnel.api.configuration.Option;
import org.apache.seatunnel.api.configuration.Options;

@SuppressWarnings("rawtypes")
public class FileBaseSinkOptions {
    public static final String SEATUNNEL = "seatunnel";
    public static final String NON_PARTITION = "NON_PARTITION";
    public static final String TRANSACTION_ID_SPLIT = "_";
    public static final String TRANSACTION_EXPRESSION = "transactionId";
    public static final String DEFAULT_FIELD_DELIMITER = ",";
    public static final String DEFAULT_ROW_DELIMITER = "\n";
    public static final String DEFAULT_PARTITION_DIR_EXPRESSION = "${k0}=${v0}/${k1}=${v1}";
    public static final String DEFAULT_TMP_PATH = ".tmp/";
    public static final String DEFAULT_FILE_NAME_EXPRESSION = "${transactionId}";
    public static final int DEFAULT_BATCH_SIZE = 1000000;

    public static final Option COMPRESS_CODEC;
    public static final Option ARCHIVE_COMPRESS_CODEC;
    public static final Option TXT_COMPRESS;
    public static final Option PARQUET_COMPRESS;
    public static final Option ORC_COMPRESS;
    public static final Option FILE_PATH;
    public static final Option FIELD_DELIMITER;
    public static final Option SHEET_MAX_ROWS;
    public static final Option ROW_DELIMITER;
    public static final Option HAVE_PARTITION;
    public static final Option PARTITION_BY;
    public static final Option PARTITION_DIR_EXPRESSION;
    public static final Option IS_PARTITION_FIELD_WRITE_IN_FILE;
    public static final Option TMP_PATH;
    public static final Option CUSTOM_FILENAME;
    public static final Option FILE_NAME_EXPRESSION;
    public static final Option SINGLE_FILE_MODE;
    public static final Option CREATE_EMPTY_FILE_WHEN_NO_DATA;
    public static final Option FILENAME_TIME_FORMAT;
    public static final Option FILE_FORMAT_TYPE;
    public static final Option FILENAME_EXTENSION;
    public static final Option ENCODING;
    public static final Option SINK_COLUMNS;
    public static final Option IS_ENABLE_TRANSACTION;
    public static final Option BATCH_SIZE;
    public static final Option HDFS_SITE_PATH;
    public static final Option REMOTE_USER;
    public static final Option MAX_ROWS_IN_MEMORY;
    public static final Option SHEET_NAME;
    public static final Option XML_ROOT_TAG;
    public static final Option XML_ROW_TAG;
    public static final Option XML_USE_ATTR_FORMAT;
    public static final Option ENABLE_HEADER_WRITE;
    public static final Option PARQUET_AVRO_WRITE_TIMESTAMP_AS_INT96;
    public static final Option PARQUET_AVRO_WRITE_FIXED_AS_INT96;
    public static final Option SCHEMA_SAVE_MODE;
    public static final Option DATA_SAVE_MODE;
    public static final Option CSV_STRING_QUOTE_MODE;
    public static final Option KERBEROS_PRINCIPAL;
    public static final Option KRB5_PATH;
    public static final Option KERBEROS_KEYTAB_PATH;
    public static final Option MERGE_UPDATE_EVENT;
    public static final Option DATE_FORMAT_LEGACY;
    public static final Option DATETIME_FORMAT_LEGACY;
    public static final Option TIME_FORMAT_LEGACY;

    static {
        COMPRESS_CODEC = Options.key("compress_codec").stringType().noDefaultValue();
        ARCHIVE_COMPRESS_CODEC =
                Options.key("archive_compress_codec").stringType().noDefaultValue();
        TXT_COMPRESS = Options.key("txt_compress").stringType().noDefaultValue();
        PARQUET_COMPRESS = Options.key("parquet_compress").stringType().noDefaultValue();
        ORC_COMPRESS = Options.key("orc_compress").stringType().noDefaultValue();
        FILE_PATH = Options.key("file_path").stringType().noDefaultValue();
        FIELD_DELIMITER = Options.key("field_delimiter").stringType().noDefaultValue();
        SHEET_MAX_ROWS = Options.key("sheet_max_rows").stringType().noDefaultValue();
        ROW_DELIMITER = Options.key("row_delimiter").stringType().noDefaultValue();
        HAVE_PARTITION = Options.key("have_partition").booleanType().noDefaultValue();
        PARTITION_BY = Options.key("partition_by").listType().noDefaultValue();
        PARTITION_DIR_EXPRESSION =
                Options.key("partition_dir_expression").stringType().noDefaultValue();
        IS_PARTITION_FIELD_WRITE_IN_FILE =
                Options.key("is_partition_field_write_in_file").booleanType().noDefaultValue();
        TMP_PATH = Options.key("tmp_path").stringType().noDefaultValue();
        CUSTOM_FILENAME = Options.key("custom_filename").booleanType().noDefaultValue();
        FILE_NAME_EXPRESSION = Options.key("file_name_expression").stringType().noDefaultValue();
        SINGLE_FILE_MODE = Options.key("single_file_mode").booleanType().noDefaultValue();
        CREATE_EMPTY_FILE_WHEN_NO_DATA =
                Options.key("create_empty_file_when_no_data").booleanType().noDefaultValue();
        FILENAME_TIME_FORMAT = Options.key("filename_time_format").stringType().noDefaultValue();
        FILE_FORMAT_TYPE = Options.key("file_format_type").stringType().noDefaultValue();
        FILENAME_EXTENSION = Options.key("filename_extension").stringType().noDefaultValue();
        ENCODING = Options.key("encoding").stringType().noDefaultValue();
        SINK_COLUMNS = Options.key("sink_columns").listType().noDefaultValue();
        IS_ENABLE_TRANSACTION = Options.key("is_enable_transaction").booleanType().noDefaultValue();
        BATCH_SIZE = Options.key("batch_size").stringType().noDefaultValue();
        HDFS_SITE_PATH = Options.key("hdfs_site_path").stringType().noDefaultValue();
        REMOTE_USER = Options.key("remote_user").stringType().noDefaultValue();
        MAX_ROWS_IN_MEMORY = Options.key("max_rows_in_memory").stringType().noDefaultValue();
        SHEET_NAME = Options.key("sheet_name").stringType().noDefaultValue();
        XML_ROOT_TAG = Options.key("xml_root_tag").stringType().noDefaultValue();
        XML_ROW_TAG = Options.key("xml_row_tag").stringType().noDefaultValue();
        XML_USE_ATTR_FORMAT = Options.key("xml_use_attr_format").booleanType().noDefaultValue();
        ENABLE_HEADER_WRITE = Options.key("enable_header_write").booleanType().noDefaultValue();
        PARQUET_AVRO_WRITE_TIMESTAMP_AS_INT96 =
                Options.key("parquet_avro_write_timestamp_as_int96").booleanType().noDefaultValue();
        PARQUET_AVRO_WRITE_FIXED_AS_INT96 =
                Options.key("parquet_avro_write_fixed_as_int96").listType().noDefaultValue();
        SCHEMA_SAVE_MODE = Options.key("schema_save_mode").stringType().noDefaultValue();
        DATA_SAVE_MODE = Options.key("data_save_mode").stringType().noDefaultValue();
        CSV_STRING_QUOTE_MODE = Options.key("csv_string_quote_mode").stringType().noDefaultValue();
        KERBEROS_PRINCIPAL = Options.key("kerberos_principal").stringType().noDefaultValue();
        KRB5_PATH = Options.key("krb5_path").stringType().noDefaultValue();
        KERBEROS_KEYTAB_PATH = Options.key("kerberos_keytab_path").stringType().noDefaultValue();
        MERGE_UPDATE_EVENT = Options.key("merge_update_event").booleanType().noDefaultValue();
        DATE_FORMAT_LEGACY = Options.key("date_format_legacy").stringType().noDefaultValue();
        DATETIME_FORMAT_LEGACY =
                Options.key("datetime_format_legacy").stringType().noDefaultValue();
        TIME_FORMAT_LEGACY = Options.key("time_format_legacy").stringType().noDefaultValue();
    }
}
