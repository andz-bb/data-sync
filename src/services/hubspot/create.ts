import * as hubspot from "@hubspot/api-client";

import { batchAssociateAccounts } from "./associate";

const { HUBSPOT_ACCESS_TOKEN, HUBSPOT_OBJECT_ID } = process.env;

const client = new hubspot.Client({
  accessToken: HUBSPOT_ACCESS_TOKEN,
});

export async function batchCreateAccounts(batch: any): Promise<any> {
  const inputs = batch.map((x) => {
    return {
      properties: {
        tenant_id: x.TENANT,
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
      },
    };
  });

  try {
    const res = await client.crm.objects.batchApi.create(HUBSPOT_OBJECT_ID, {
      inputs,
    });
    console.log(res);
    await batchAssociateAccounts(res.results);
    return res;
  } catch (err) {
    console.log("oof", err);
    throw err;
  }
}
