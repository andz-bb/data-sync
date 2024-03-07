import * as hubspot from "@hubspot/api-client";

import axios from "axios";

const { HUBSPOT_ACCESS_TOKEN, HUBSPOT_OBJECT_ID } = process.env;

const client = new hubspot.Client({
  accessToken: HUBSPOT_ACCESS_TOKEN,
});

const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
  },
};

const associationMappings = {
  companies: {
    single: "company",
    associationType: "custom_object_schema_to_company",
  },
  contacts: {
    single: "contact",
    associationType: "custom_object_schema_to_contact",
  },
};

async function batchAssociateObjects(accounts, objectType, tenantProperty) {
  const tenantIds = accounts.map((acc) => acc.properties.tenant_id);
  const objects = await getObjectsByTenantId(
    tenantIds,
    objectType,
    tenantProperty
  );

  const objectMap = objects.reduce((map, obj) => {
    map[obj.properties[tenantProperty]] = obj.id;
    return map;
  }, {});

  const { single, associationType } = associationMappings[objectType];
  const associations = accounts
    .map((acc) => {
      const objectId = objectMap[acc.properties.tenant_id];
      return objectId
        ? {
            _from: { id: acc.id },
            to: { id: objectId },
            type: associationType,
          }
        : null;
    })
    .filter((association) => association);

  if (associations.length) {
    try {
      const res = await client.crm.associations.batchApi.create(
        HUBSPOT_OBJECT_ID,
        single,
        { inputs: associations }
      );
      console.log(`${objectType} associations response: `, res);
      return res;
    } catch (err) {
      console.error(`Error associating ${objectType}: `, err);
    }
  } else {
    console.log(`No related ${objectType}`);
  }
}

async function getObjectsByTenantId(ids, objectType, tenantProperty) {
  const properties = [tenantProperty];
  const filters = [
    { propertyName: tenantProperty, operator: "IN", values: ids },
  ];

  const req = { filters, properties, limit: 100 };

  const url = `https://api.hubapi.com/crm/v3/objects/${objectType}/search`;

  try {
    const res = await axios.post(url, req, config);
    return res.data.results;
  } catch (err) {
    console.error(`Error getting ${objectType} by tenant id:`, err);
  }
}

export async function batchAssociateAccounts(accounts) {
  await batchAssociateObjects(accounts, "companies", "tenant");
  await batchAssociateObjects(accounts, "contacts", "cloud_tenant");
}
