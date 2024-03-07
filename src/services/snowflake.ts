import snowflake from "snowflake-sdk";

const {
  SNOWFLAKE_ACCOUNT,
  SNOWFLAKE_USER,
  SNOWFLAKE_PASSWORD,
  SNOWFLAKE_REGION,
  SNOWFLAKE_DATABASE,
  SNOWFLAKE_SCHEMA,
} = process.env;

const config = {
  account: SNOWFLAKE_ACCOUNT,
  username: SNOWFLAKE_USER,
  password: SNOWFLAKE_PASSWORD,
  region: SNOWFLAKE_REGION,
  database: SNOWFLAKE_DATABASE,
  schema: SNOWFLAKE_SCHEMA,
};

export async function streamSnowflakeData(
  query: string,
  processBatch: (batch: any[]) => Promise<void>
): Promise<void> {
  const batchSize = 100; // hubspot limit
  const client = snowflake.createConnection(config);

  try {
    await new Promise<void>((resolve, reject) => {
      client.connect((err, conn) => {
        if (err) {
          console.error("snowflake connection failed: ", err);
          reject(err);
          return;
        }

        conn.execute({
          sqlText: query,
          streamResult: true,
          complete: (err, stmt) => {
            if (err) {
              console.error("snowflake query failed: ", err);
              reject(err);
              return;
            }

            let totalRows = stmt.getNumRows();
            let start = 0;
            let end = Math.min(batchSize - 1, totalRows - 1);

            const processNextBatch = () => {
              if (start >= totalRows) {
                resolve();
                return;
              }

              let batch = [];
              stmt
                .streamRows({ start, end })
                .on("error", (err) => {
                  console.error("unable to stream rows: ", err);
                  reject(err);
                })
                .on("data", (row) => {
                  batch.push(row);
                })
                .on("end", async () => {
                  await processBatch(batch);

                  start = end + 1;
                  end = Math.min(start + batchSize - 1, totalRows - 1);
                  processNextBatch();
                });
            };

            processNextBatch();
          },
        });
      });
    });
  } catch (error) {
    console.error("snowflake stream error: ", error);
    throw error;
  }
}
