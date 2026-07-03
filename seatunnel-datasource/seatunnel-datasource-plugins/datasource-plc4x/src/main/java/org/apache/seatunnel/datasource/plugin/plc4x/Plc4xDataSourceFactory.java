package org.apache.seatunnel.datasource.plugin.plc4x;

import org.apache.seatunnel.datasource.plugin.api.DataSourceChannel;
import org.apache.seatunnel.datasource.plugin.api.DataSourceFactory;
import org.apache.seatunnel.datasource.plugin.api.DataSourcePluginInfo;

import com.google.auto.service.AutoService;

import java.util.Set;

@AutoService(DataSourceFactory.class)
public class Plc4xDataSourceFactory implements DataSourceFactory {

    @Override
    public String factoryIdentifier() {
        return Plc4xDataSourceConfig.PLUGIN_NAME;
    }

    @Override
    public Set<DataSourcePluginInfo> supportedDataSources() {
        return Set.of(Plc4xDataSourceConfig.PLC4X_DATASOURCE_PLUGIN_INFO);
    }

    @Override
    public DataSourceChannel createChannel() {
        return new Plc4xDataSourceChannel();
    }
}
