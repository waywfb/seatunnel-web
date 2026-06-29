const DATASOURCE_ICONS: Record<string, string> = {
  'JDBC-Mysql': 'MYSQL',
  'JDBC-Oracle': 'ORACLE',
  'JDBC-Postgres': 'POSTGRES',
  'JDBC-SQLServer': 'SQLSERVER',
  'JDBC-ClickHouse': 'CLICKHOUSE',
  'JDBC-TiDB': 'TIDB',
  'JDBC-Db2': 'DB2',
  'JDBC-Hive': 'HIVE',
  'JDBC-StarRocks': 'STARROCKS',
  'JDBC-Redshift': 'REDSHIFT',
  'MySQL-CDC': 'MYSQLCDC',
  'SqlServer-CDC': 'SQLSERVERCDC',
  'Postgres-CDC': 'POSTGRESCDC',
  'Kafka': 'KAFKA',
  'ElasticSearch': 'ELASTICSEARCH',
  'Hive': 'HIVE',
  'S3': 'S3',
  'StarRocks': 'STARROCKS',
  'MongoDB': 'MONGODB',
  'Http': 'HTTP',
  'FakeSource': 'FAKESOURCE',
  'Console': 'CONSOLE',
  'S3-Redshift': 'REDSHIFT',
}

const ICON_COLORS: Record<string, string> = {
  MYSQL: '#4479A1',
  ORACLE: '#F80000',
  POSTGRES: '#336791',
  SQLSERVER: '#CC2927',
  CLICKHOUSE: '#FCC624',
  TIDB: '#D92B27',
  DB2: '#054ADA',
  HIVE: '#FDF100',
  STARROCKS: '#F7DF1E',
  REDSHIFT: '#8DC4F2',
  MYSQLCDC: '#4479A1',
  SQLSERVERCDC: '#CC2927',
  POSTGRESCDC: '#336791',
  KAFKA: '#231F20',
  ELASTICSEARCH: '#00BFB3',
  S3: '#569A31',
  MONGODB: '#47A248',
  HTTP: '#F16529',
  FAKESOURCE: '#6B7280',
  CONSOLE: '#6B7280',
}

export function getDatasourceIcon(name: string): string {
  return DATASOURCE_ICONS[name] || 'DATABASE'
}

export function getDatasourceIconColor(name: string): string {
  const iconKey = getDatasourceIcon(name)
  return ICON_COLORS[iconKey] || '#6B7280'
}

export function datasourceIconSvg(name: string): string {
  const iconKey = getDatasourceIcon(name)
  const color = getDatasourceIconColor(name)
  const initial = iconKey.charAt(0)

  return `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="${color}" opacity="0.85"/>
    <text x="16" y="22" text-anchor="middle" fill="#fff" font-size="16" font-weight="bold" font-family="Arial,sans-serif">${initial}</text>
  </svg>`
}
