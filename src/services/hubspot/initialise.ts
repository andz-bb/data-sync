import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

export async function createHubSpotCustomObject(): Promise<void> {
  const schema = {
    name: "custom_object_schema",
    labels: {
      singular: "Account",
      plural: "Accounts",
    },
    primaryDisplayProperty: "tenant_id",
    requiredProperties: ["tenant_id"],
    searchableProperties: ["tenant_id"],
    properties: [
      {
        name: "tenant_id",
        label: "Tenant ID",
        type: "string",
        fieldType: "text",
        hasUniqueValue: true,
      },
      {
        name: "last_logged_in",
        label: "Last Logged In",
        type: "datetime",
        fieldType: "date",
      },
      {
        name: "total_apps",
        label: "Total Apps",
        type: "number",
        fieldType: "number",
      },
      {
        name: "total_users",
        label: "Total Users",
        type: "number",
        fieldType: "number",
      },
      {
        name: "active_users",
        label: "Active Users",
        type: "number",
        fieldType: "number",
      },
      {
        name: "current_mrr",
        label: "Current MRR",
        type: "number",
        fieldType: "number",
      },
      {
        name: "current_plan",
        label: "Current Plan",
        type: "enumeration",
        fieldType: "select",
        options: [
          { label: "Free", value: "free", displayOrder: 0 },
          { label: "Pro", value: "pro", displayOrder: 1 },
          { label: "Premium", value: "premium", displayOrder: 2 },
          { label: "Premium Plus", value: "premium_plus", displayOrder: 3 },
          { label: "Team", value: "team", displayOrder: 4 },
          { label: "Business", value: "business", displayOrder: 5 },
          { label: "Enterprise", value: "enterprise", displayOrder: 6 },
          {
            label: "Enterprise Basic",
            value: "enterprise_basic",
            displayOrder: 7,
          },
        ],
        hasOther: false,
        formField: true,
      },
      {
        name: "subscription_status",
        label: "Subscription Status",
        type: "enumeration",
        fieldType: "select",
        options: [
          {
            label: "Active",
            value: "active",
            displayOrder: 0,
            hidden: false,
          },
          {
            label: "Canceled",
            value: "canceled",
            displayOrder: 1,
            hidden: false,
          },
          {
            label: "Incomplete",
            value: "incomplete",
            displayOrder: 2,
            hidden: false,
          },
          {
            label: "Incomplete Expired",
            value: "incomplete_expired",
            displayOrder: 3,
            hidden: false,
          },
        ],
        hasOther: true,
      },
      {
        name: "billing_cycle",
        label: "Billing Cycle",
        type: "enumeration",
        fieldType: "select",
        options: [
          {
            label: "Annual",
            value: "year",
            displayOrder: 0,
            hidden: false,
          },
          {
            label: "Monthly",
            value: "month",
            displayOrder: 1,
            hidden: false,
          },
        ],
      },
      {
        name: "sso_configured",
        label: "SSO Configured",
        type: "enumeration",
        fieldType: "booleancheckbox",
        options: [
          {
            label: "Yes",
            value: "true",
            displayOrder: 0,
            hidden: false,
          },
          {
            label: "No",
            value: "false",
            displayOrder: 1,
            hidden: false,
          },
        ],
      },
      {
        name: "user_groups_count",
        label: "User Groups Count",
        type: "number",
        fieldType: "number",
      },
    ],

    associatedObjects: ["CONTACT", "COMPANY"],
    metaType: "PORTAL_SPECIFIC",
    associations: [
      {
        fromObjectTypeId: "account",
        toObjectTypeId: "0-1",
        // name: "Account_to_Contact",
        name: "custom_object_schema_to_companies",
        cardinality: "ONE_TO_MANY",
      },
      {
        fromObjectTypeId: "account",
        toObjectTypeId: "0-2",
        // name: "Account_to_Company",
        name: "custom_object_schema_to_contacts",
        cardinality: "ONE_TO_MANY",
      },
    ],
  };

  const url = `https://api.hubapi.com/crm/v3/schemas`;

  try {
    const res = await axios.post(url, schema, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      },
    });

    console.log(
      "we're done here, take the object id and add it to your env variables: ",
      res.data
    );
    return res.data;
  } catch (err) {
    console.error("bad news: ", err);
    throw err;
  }
}

createHubSpotCustomObject();
