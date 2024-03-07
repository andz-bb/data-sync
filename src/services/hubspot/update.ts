import axios from "axios";

const { HUBSPOT_ACCESS_TOKEN, HUBSPOT_OBJECT_ID, HUBSPOT_UNIQUE_PROPERTY } =
  process.env;

const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
  },
};

export async function batchUpdateAccounts(batch: any): Promise<any> {
  console.log("batch: ", batch);

  const inputs = batch.map((x) => {
    return {
      id: x.TENANT,
      idProperty: HUBSPOT_UNIQUE_PROPERTY,
      // hubspot api doesn't like these possibly being null on an update... come up with something smarter
      properties: {
        // last_logged_in: x.LASTLOGGEDIN ? x.LASTLOGGEDIN.toJSON() : null,
        // total_apps: x.TOTALAPPS,
        // total_users: x.TOTALUSERS,
        // active_users: x.ACTIVEUSERS,
        // current_mrr: x.CURRENTMRR,
        // current_plan: x.CURRRENTPLAN,
        // subscription_status: x.SUBSCRIPTIONSTATUS,
        // billing_cycle: x.BILLINGCYCLE,
        // sso_configured: x.SSOCONFIGURED ? "true" : "false",
        user_groups_count: x.USERGROUPSCOUNT ?? 0,
      },
    };
  });

  const url = `https://api.hubapi.com/crm/v3/objects/${HUBSPOT_OBJECT_ID}/batch/update`;

  try {
    const res = await axios.post(url, { inputs }, config);
    console.log(res.data);
    return res.data;
  } catch (err) {
    console.error("bad news:", err);
    const missingTenants =
      err.response?.data?.context?.missingObjectPropertyValueCoordinates ?? [];
    if (missingTenants.length > 0) {
      const ids = missingTenants.map((x) => x.split("tenant_id:")[1]);
      console.table(ids);
      console.log("blah");
      // retry update without missing tenants
      // get the missing tenant ids
      // try to pull them from snowflake
    } else throw err;
  }
}
