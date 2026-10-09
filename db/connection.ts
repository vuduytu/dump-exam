// TiDB Cloud Serverless requires TLS; local MAMP does not.
export function connectionFromUrl(url: string) {
  const u = new URL(url);
  const tls = u.hostname.endsWith("tidbcloud.com");
  return {
    host: u.hostname,
    port: Number(u.port) || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1),
    ...(tls && { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }),
  };
}
