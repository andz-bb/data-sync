import axios from "axios";
import { batchCreateAccounts } from "./create";

const { HUBSPOT_ACCESS_TOKEN, HUBSPOT_OBJECT_ID, HUBSPOT_UNIQUE_PROPERTY } =
  process.env;

const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
  },
};

export async function batchUpdateAccounts(batch: any) {
  const inputs = batch.map((x) => {
    const allProperties = {
      last_logged_in: x.LASTLOGGEDIN ? x.LASTLOGGEDIN.toJSON() : null,
      total_apps: x.TOTALAPPS,
      total_users: x.TOTALUSERS,
      active_users: x.ACTIVEUSERS,
      current_mrr: x.CURRENTMRR,
      current_plan: x.CURRRENTPLAN,
      subscription_status: x.SUBSCRIPTIONSTATUS,
      billing_cycle: x.BILLINGCYCLE,
      sso_configured: x.SSOCONFIGURED ? "true" : "false",
      user_groups_count: x.USERGROUPSCOUNT,
    };

    // hubspot doesn't like when properties are null
    const properties = Object.fromEntries(
      Object.entries(allProperties).filter(([key, value]) => value !== null)
    );

    return {
      id: x.TENANT,
      idProperty: HUBSPOT_UNIQUE_PROPERTY,
      properties,
    };
  });

  const url = `https://api.hubapi.com/crm/v3/objects/${HUBSPOT_OBJECT_ID}/batch/update`;

  try {
    const res = await axios.post(url, { inputs }, config);
    return res.data;
  } catch (err) {
    const missingTenants =
      err.response?.data?.context?.missingObjectPropertyValueCoordinates ?? [];

    if (missingTenants.length > 0) {
      const ids = missingTenants.map((x) => x.split("tenant_id:")[1]);

      const { tenantsToCreate, tenantsToUpdate } = batch.reduce(
        (res, tenant) => {
          if (ids.includes(tenant.TENANT)) {
            res.tenantsToCreate.push(tenant);
          } else {
            res.tenantsToUpdate.push(tenant);
          }
          return res;
        },
        { tenantsToCreate: [], tenantsToUpdate: [] }
      );

      await batchCreateAccounts(tenantsToCreate);
      await batchUpdateAccounts(tenantsToUpdate);
    } else throw err;
  }
}
