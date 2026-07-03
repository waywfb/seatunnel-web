package org.apache.seatunnel.plc4x.bridge.sink;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.util.List;
import java.util.stream.Collectors;

public class JdbcSink {

    private static final Logger log = LoggerFactory.getLogger(JdbcSink.class);

    private final JdbcTemplate jdbcTemplate;
    private final String tableName;

    public JdbcSink(String url, String user, String password, String tableName) {
        this.tableName = tableName;
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(user);
        config.setPassword(password);
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(5000);
        config.setIdleTimeout(300_000);
        DataSource ds = new HikariDataSource(config);
        this.jdbcTemplate = new JdbcTemplate(ds);
    }

    public void write(List<Object[]> batch) {
        if (batch == null || batch.isEmpty()) return;
        String sql = buildInsertSql(batch.get(0));
        jdbcTemplate.batchUpdate(sql, batch);
        log.debug("Batch written: {} rows to {}", batch.size(), tableName);
    }

    private String buildInsertSql(Object[] firstRow) {
        int columns = firstRow.length - 2;
        String colNames = java.util.stream.IntStream.range(0, columns)
                .mapToObj(i -> "col_" + i)
                .collect(Collectors.joining(", "));
        String placeholders = java.util.stream.IntStream.range(0, columns)
                .mapToObj(i -> "?")
                .collect(Collectors.joining(", "));
        return "INSERT INTO " + tableName + " (" + colNames + ") VALUES (" + placeholders + ")";
    }
}
