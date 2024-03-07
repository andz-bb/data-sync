import dotenv from "dotenv";
dotenv.config();

import { batchCreateAccounts } from "./services/hubspot/create";
import { streamSnowflakeData } from "./services/snowflake";

async function createAccountObjects(): Promise<void> {
  const query = `select 
    pql.tenant_id as tenant,
    max(act.day_date) as LastLoggedIn, -- assuming entry in activity table is user activity
    max_by(pql.total_apps, pql.date_id) as TotalApps,
    max_by(pql.total_users, pql.date_id) as TotalUsers,
    max_by(pql.active_users, pql.date_id) as ActiveUsers,
    max_by(sub.mrr_usd, sub.month_dt) as CurrentMRR,
    max_by(pql.current_plan, pql.date_id) as CurrrentPlan,
    max_by(sub.status, sub.month_dt) as SubscriptionStatus,
    -- max_by(sub.cancel_at_date, sub.month_dt) as CancelAtDate,
    -- max_by(sub.cancel_date, sub.month_dt) as CancelDate,
    max_by(sub.plan_billing_cycle, sub.month_dt) as BillingCycle,
    max_by(pql.sso_configured, pql.date_id) as SSOConfigured,
    max_by(quo.user_groups_count, quo.date) as UserGroupsCount  

    from the_eye_bb_schema.facts_pql pql
    left join the_eye_bb_schema.facts_activity act on act.tenant_id = pql.tenant_id and act.day_date = pql.date_id
    left join the_eye_bb_schema.facts_subscription_monthly sub on sub.tenant_id = pql.tenant_id and date_trunc(month, pql.date_id) = date_trunc(month, sub.month_dt)
    left join the_eye_bb_schema.facts_quotas quo on quo.tenant_id = pql.tenant_id and quo.date = pql.date_id


    where pql.tenant_id not like '%_default'
    and  SPLIT_PART(replace(pql.tenant_id, '"', ''), '@', 2) not in (select domain from the_eye_schema.manual_public_email_domains)
    group by tenant;`;

  try {
    await streamSnowflakeData(query, batchCreateAccounts);
  } catch (err) {
    console.error("oof: ", err);
    throw err;
  }
}

createAccountObjects();
