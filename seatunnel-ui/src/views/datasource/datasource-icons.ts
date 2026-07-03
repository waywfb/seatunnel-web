import mysqlSvg from '@/assets/Mysql.svg'
import oracleSvg from '@/assets/Oracle.svg'
import postgresSvg from '@/assets/postgres.svg'
import sqlserverSvg from '@/assets/sqlserver.svg'
import clickhouseSvg from '@/assets/ClickHouse.svg'
import tidbSvg from '@/assets/TiDB.svg'
import db2Svg from '@/assets/DB2.svg'
import hiveSvg from '@/assets/Hive.svg'
import starrocksSvg from '@/assets/starrocks.svg'
import kafkaSvg from '@/assets/kafka.svg'
import elasticsearchSvg from '@/assets/elasticsearch.svg'
import s3Svg from '@/assets/AWS_S3.svg'
import mongodbSvg from '@/assets/mongoDB.svg'
import httpSvg from '@/assets/Http.svg'

const SVG_MAP: Record<string, string> = {
  'JDBC-Mysql': mysqlSvg,
  'JDBC-Oracle': oracleSvg,
  'JDBC-Postgres': postgresSvg,
  'JDBC-SQLServer': sqlserverSvg,
  'JDBC-ClickHouse': clickhouseSvg,
  'JDBC-TiDB': tidbSvg,
  'JDBC-Db2': db2Svg,
  'JDBC-Hive': hiveSvg,
  'JDBC-StarRocks': starrocksSvg,
  'MySQL-CDC': mysqlSvg,
  'SqlServer-CDC': sqlserverSvg,
  'Postgres-CDC': postgresSvg,
  'Kafka': kafkaSvg,
  'ElasticSearch': elasticsearchSvg,
  'Hive': hiveSvg,
  'S3': s3Svg,
  'S3-Redshift': s3Svg,
  'StarRocks': starrocksSvg,
  'MongoDB': mongodbSvg,
  'Http': httpSvg,
  'Plc4x': '',
}

const ICON_COLORS: Record<string, string> = {
  'JDBC-Mysql': '#4479A1',
  'JDBC-Oracle': '#F80000',
  'JDBC-Postgres': '#336791',
  'JDBC-SQLServer': '#CC2927',
  'JDBC-ClickHouse': '#FCC624',
  'JDBC-TiDB': '#D92B27',
  'JDBC-Db2': '#054ADA',
  'JDBC-Hive': '#FDF100',
  'JDBC-StarRocks': '#F7DF1E',
  'JDBC-Redshift': '#8DC4F2',
  'MySQL-CDC': '#4479A1',
  'SqlServer-CDC': '#CC2927',
  'Postgres-CDC': '#336791',
  'Kafka': '#231F20',
  'ElasticSearch': '#00BFB3',
  'Hive': '#FDF100',
  'S3': '#569A31',
  'S3-Redshift': '#569A31',
  'StarRocks': '#F7DF1E',
  'MongoDB': '#47A248',
  'Http': '#F16529',
  'FakeSource': '#6B7280',
  'Console': '#6B7280',
  'Plc4x': '#00A3E0',
}

export function getDatasourceIcon(name: string): string {
  return SVG_MAP[name] || ''
}

export function getDatasourceIconColor(name: string): string {
  return ICON_COLORS[name] || '#6B7280'
}

export function datasourceIconSvg(name: string): string {
  return SVG_MAP[name] || fallbackSvg(name)
}

function fallbackSvg(name: string): string {
  const color = getDatasourceIconColor(name)
  const initial = name.charAt(0).toUpperCase()
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="${color}" opacity="0.85"/>
      <text x="16" y="22" text-anchor="middle" fill="#fff" font-size="16" font-weight="bold" font-family="Arial,sans-serif">${initial}</text>
    </svg>`
  )}`
}
