#!/usr/bin/env node
/**
 * MCP Server generated from OpenAPI spec for attio-mcp-server v1.0.0
 * Generated on: 2025-06-07T00:11:37.634Z
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { AsyncLocalStorage } from 'node:async_hooks';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  type CallToolRequest,
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';
import { jsonSchemaToZod } from 'json-schema-to-zod';
import { ZodError, z } from 'zod';
import { transformToolName } from './tool-name-transformer.js';

export const attioTokenStore = new AsyncLocalStorage<string>();

/**
 * Type definition for JSON objects
 */
type JsonObject = Record<string, any>;

/**
 * Interface for MCP Tool Definition
 */
interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  method: string;
  pathTemplate: string;
  executionParameters: { name: string; in: string }[];
  requestBodyContentType?: string;
  securityRequirements: any[];
}

/**
 * Server configuration
 */
export const SERVER_NAME = 'attio-mcp-server';
export const SERVER_VERSION = '1.0.0';
export const API_BASE_URL = 'https://api.attio.com';

/**
 * MCP Server instance (used for stdio mode)
 */
const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

/**
 * Map of tool definitions by name
 */
const toolDefinitionMap: Map<string, McpToolDefinition> = new Map([
  [
    'getv2objects',
    {
      name: 'getv2objects',
      description: `Lists all system-defined and user-defined objects in your workspace.

Required scopes: \`object_configuration:read\`.`,
      inputSchema: { type: 'object', properties: {} },
      method: 'get',
      pathTemplate: '/v2/objects',
      executionParameters: [],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['object_configuration:read'] }],
    },
  ],
  [
    'postv2objects',
    {
      name: 'postv2objects',
      description: `Creates a new custom object in your workspace.

Required scopes: \`object_configuration:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  api_slug: {
                    type: 'string',
                    description:
                      'A unique, human-readable slug to access the object through URLs and API calls. Should be formatted in snake case.',
                  },
                  singular_noun: {
                    type: 'string',
                    minLength: 1,
                    description: "The singular form of the object's name.",
                  },
                  plural_noun: {
                    type: 'string',
                    minLength: 1,
                    description: "The plural form of the object's name.",
                  },
                },
                required: ['api_slug', 'singular_noun', 'plural_noun'],
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/objects',
      executionParameters: [],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['object_configuration:read-write'] }],
    },
  ],
  [
    'getv2objectsbyobject',
    {
      name: 'getv2objectsbyobject',
      description: `Gets a single object by its \`object_id\` or slug.

Required scopes: \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          object: { type: 'string', description: 'A UUID or slug to identify the object.' },
        },
        required: ['object'],
      },
      method: 'get',
      pathTemplate: '/v2/objects/{object}',
      executionParameters: [{ name: 'object', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['object_configuration:read'] }],
    },
  ],
  [
    'patchv2objectsbyobject',
    {
      name: 'patchv2objectsbyobject',
      description: `Updates a single object. The object to be updated is identified by its \`object_id\`.

Required scopes: \`object_configuration:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          object: { type: 'string', description: 'A UUID or slug to identify the object.' },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  api_slug: {
                    type: 'string',
                    description:
                      'A unique, human-readable slug to access the object through URLs and API calls. Should be formatted in snake case.',
                  },
                  singular_noun: {
                    type: 'string',
                    minLength: 1,
                    description: "The singular form of the object's name.",
                  },
                  plural_noun: {
                    type: 'string',
                    minLength: 1,
                    description: "The plural form of the object's name.",
                  },
                },
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['object', 'requestBody'],
      },
      method: 'patch',
      pathTemplate: '/v2/objects/{object}',
      executionParameters: [{ name: 'object', in: 'path' }],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['object_configuration:read-write'] }],
    },
  ],
  [
    'getv2attributes',
    {
      name: 'getv2attributes',
      description: `Lists all attributes defined on a specific object or list. Attributes are returned in the order that they are sorted by in the UI.

Required scopes: \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['objects', 'lists'],
            description: 'Whether the attributes are on an object or a list.',
          },
          identifier: {
            type: 'string',
            description: 'A UUID or slug to identify the object or list the attributes belong to.',
          },
          limit: {
            type: 'number',
            description:
              'The maximum number of results to return. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
          offset: {
            type: 'number',
            description:
              'The number of results to skip over before returning. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
          show_archived: {
            type: 'boolean',
            description:
              'Whether archived attributes should be included in the results. See the [full guide to archiving here](/docs/archiving-vs-deleting).',
          },
        },
        required: ['target', 'identifier'],
      },
      method: 'get',
      pathTemplate: '/v2/{target}/{identifier}/attributes',
      executionParameters: [
        { name: 'target', in: 'path' },
        { name: 'identifier', in: 'path' },
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'show_archived', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['object_configuration:read'] }],
    },
  ],
  [
    'postv2attributes',
    {
      name: 'postv2attributes',
      description: `Creates a new attribute on either an object or a list.

To create an attribute on an object, you must also have the \`object_configuration:read-write\` scope.

To create an attribute on a list, you must also have the \`list_configuration:read-write\` scope.`,
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['objects', 'lists'],
            description: 'Whether the attribute is to be created on an object or a list.',
          },
          identifier: {
            type: 'string',
            description: 'A UUID or slug to identify the object or list the attribute belongs to.',
          },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description:
                      "The name of the attribute. The title will be visible across Attio's UI.",
                  },
                  description: {
                    type: ['string', 'null'],
                    description: 'A text description for the attribute.',
                  },
                  api_slug: {
                    type: 'string',
                    description:
                      'A unique, human-readable slug to access the attribute through URLs and API calls. Formatted in snake case.',
                  },
                  type: {
                    type: 'string',
                    enum: [
                      'text',
                      'number',
                      'checkbox',
                      'currency',
                      'date',
                      'timestamp',
                      'rating',
                      'status',
                      'select',
                      'record-reference',
                      'actor-reference',
                      'location',
                      'domain',
                      'email-address',
                      'phone-number',
                    ],
                    description:
                      'The type of the attribute. This value affects the possible `config` values. Attributes of type "status" are not supported on objects.',
                  },
                  is_required: {
                    type: 'boolean',
                    description:
                      'When `is_required` is `true`, new records/entries must have a value for this attribute. If `false`, values may be `null`. This value does not affect existing data and you do not need to backfill `null` values if changing `is_required` from `false` to `true`.',
                  },
                  is_unique: {
                    type: 'boolean',
                    description:
                      'Whether or not new values for this attribute must be unique. Uniqueness restrictions are only applied to new data and do not apply retroactively to previously created data.',
                  },
                  is_multiselect: {
                    type: 'boolean',
                    description:
                      'Whether or not this attribute can have multiple values. Multiselect is only available on some value types.',
                  },
                  default_value: {
                    oneOf: [
                      {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['dynamic'], example: 'dynamic' },
                          template: {
                            anyOf: [
                              {
                                type: 'string',
                                enum: ['current-user'],
                                description:
                                  'For actor reference attributes, you may pass a dynamic value of `"current-user"`. When creating new records or entries, this will cause the actor reference value to be populated with either the workspace member or API token that created the record/entry.',
                                example: 'current-user',
                              },
                              {
                                type: 'string',
                                description:
                                  'Timestamp attributes may use an ISO 8601 duration as a dynamic value. For example, `"P1M"` would set the value to the current time plus one month.',
                                example: 'P1M',
                              },
                              {
                                type: 'string',
                                description:
                                  'Date attributes may use an ISO 8601 duration as a dynamic value. For example, `"P1M"` would set the value to the current time plus one month.',
                                example: 'P1M',
                              },
                            ],
                          },
                        },
                        required: ['type', 'template'],
                      },
                      {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['static'], example: 'static' },
                          template: {
                            type: 'array',
                            items: {
                              anyOf: [
                                {
                                  type: 'object',
                                  properties: {
                                    referenced_actor_type: {
                                      type: 'string',
                                      enum: ['workspace-member'],
                                      description:
                                        'The type of the referenced actor. Currently, only workspace members can be written into actor reference attributes. [Read more information on actor types here](/docs/actors).',
                                      example: 'workspace-member',
                                    },
                                    referenced_actor_id: {
                                      type: 'string',
                                      format: 'uuid',
                                      description: 'The ID of the referenced Actor.',
                                      example: '50cf242c-7fa3-4cad-87d0-75b1af71c57b',
                                    },
                                  },
                                  required: ['referenced_actor_type', 'referenced_actor_id'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    workspace_member_email_address: {
                                      type: 'string',
                                      description:
                                        'Workspace member actors can be referenced by email address as well as actor ID.',
                                      example: 'alice@attio.com',
                                    },
                                  },
                                  required: ['workspace_member_email_address'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'boolean',
                                      description:
                                        "A boolean representing whether the checkbox is checked or not. The string values 'true' and 'false' are also accepted.",
                                      example: true,
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    currency_value: {
                                      type: 'number',
                                      description:
                                        'A numerical representation of the currency value. A decimal with a max of 4 decimal places.',
                                      example: 99,
                                    },
                                  },
                                  required: ['currency_value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'string',
                                      description:
                                        'A date represents a single calendar year, month and day, independent of timezone. If hours, months, seconds or timezones are provided, they will be trimmed. For example, "2023" and "2023-01" will be coerced into "2023-01-01", and "2023-01-02", "2023-01-02T13:00", "2023-01-02T14:00:00", "2023-01-02T15:00:00.000000000", and "2023-01-02T15:00:00.000000000+02:00" will all be coerced to "2023-01-02". If a timezone is provided that would result in a different calendar date in UTC, the date will be coerced to UTC and then the timezone component will be trimmed. For example, the value "2023-01-02T23:00:00-10:00" will be returned as "2023-01-03". The maximum date is "9999-12-31".',
                                      example: '2023-01-01',
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    domain: {
                                      type: 'string',
                                      description: 'The full domain of the website.',
                                      example: 'app.attio.com',
                                    },
                                  },
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    email_address: {
                                      type: 'string',
                                      description: 'An email address string',
                                      example: 'alice@app.attio.com',
                                    },
                                  },
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    target_object: {
                                      type: 'string',
                                      description:
                                        'A UUID or slug to identify the object that the referenced record belongs to.',
                                      example: 'people',
                                    },
                                    target_record_id: {
                                      type: 'string',
                                      format: 'uuid',
                                      description: 'A UUID to identify the referenced record.',
                                      example: '891dcbfc-9141-415d-9b2a-2238a6cc012d',
                                    },
                                  },
                                  required: ['target_object', 'target_record_id'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  example: {
                                    target_object: 'people',
                                    matching_attribute_id_123: [
                                      { value: 'matching_attribute_id_123' },
                                    ],
                                  },
                                  properties: {
                                    target_object: {
                                      type: 'string',
                                      example: 'people',
                                      description:
                                        'A UUID or slug to identify the object that the referenced record belongs to.',
                                    },
                                    '[slug_or_id_of_matching_attribute]': {
                                      type: 'array',
                                      description:
                                        'In addition to referencing records directly by record ID, you may also reference by a matching attribute of your choice. For example, if you want to add a reference to the person record with email "alice@website.com", you should pass a value with `target_object` set to `"people"` and `email_addresses` set to `[{email_address:"alice@website.com"}]`. The key should be the slug or ID of the matching attribute you would like to use and the value should be an array containing a single value of the appropriate attribute type (as specified below). Matching on multiple values is not currently supported. Matching attributes must be unique. This process is similar to how you use the `matching_attribute` query param in Attio\'s [assert endpoints](/rest-api/endpoint-reference/records/assert-a-record).',
                                      items: {
                                        anyOf: [
                                          {
                                            type: 'object',
                                            properties: {
                                              domain: {
                                                type: 'string',
                                                example: 'app.attio.com',
                                                description: 'The full domain of the website.',
                                              },
                                            },
                                          },
                                          {
                                            type: 'object',
                                            properties: {
                                              email_address: {
                                                type: 'string',
                                                example: 'alice@app.attio.com',
                                                description: 'An email address string',
                                              },
                                            },
                                          },
                                          {
                                            type: 'object',
                                            properties: {
                                              value: {
                                                type: 'number',
                                                example: 17224912,
                                                description:
                                                  'Numbers are persisted as 64 bit floats.',
                                              },
                                            },
                                          },
                                          {
                                            type: 'object',
                                            properties: {
                                              original_phone_number: {
                                                type: 'string',
                                                example: '07234172834',
                                                description:
                                                  'The raw, original phone number, as inputted.',
                                              },
                                              country_code: {
                                                type: ['string', 'null'],
                                                enum: [
                                                  'AF',
                                                  'AX',
                                                  'AL',
                                                  'DZ',
                                                  'AS',
                                                  'AD',
                                                  'AO',
                                                  'AI',
                                                  'AQ',
                                                  'AG',
                                                  'AR',
                                                  'AM',
                                                  'AW',
                                                  'AU',
                                                  'AT',
                                                  'AZ',
                                                  'BS',
                                                  'BH',
                                                  'BD',
                                                  'BB',
                                                  'BY',
                                                  'BE',
                                                  'BZ',
                                                  'BJ',
                                                  'BM',
                                                  'BT',
                                                  'BO',
                                                  'BA',
                                                  'BW',
                                                  'BV',
                                                  'BR',
                                                  'IO',
                                                  'BN',
                                                  'BG',
                                                  'BF',
                                                  'BI',
                                                  'KH',
                                                  'CM',
                                                  'CA',
                                                  'CV',
                                                  'KY',
                                                  'CF',
                                                  'TD',
                                                  'CL',
                                                  'CN',
                                                  'CX',
                                                  'CC',
                                                  'CO',
                                                  'KM',
                                                  'CG',
                                                  'CD',
                                                  'CK',
                                                  'CR',
                                                  'CI',
                                                  'HR',
                                                  'CU',
                                                  'CW',
                                                  'CY',
                                                  'CZ',
                                                  'DK',
                                                  'DJ',
                                                  'DM',
                                                  'DO',
                                                  'EC',
                                                  'EG',
                                                  'SV',
                                                  'GQ',
                                                  'ER',
                                                  'EE',
                                                  'ET',
                                                  'FK',
                                                  'FO',
                                                  'FJ',
                                                  'FI',
                                                  'FR',
                                                  'GF',
                                                  'PF',
                                                  'TF',
                                                  'GA',
                                                  'GM',
                                                  'GE',
                                                  'DE',
                                                  'GH',
                                                  'GI',
                                                  'GR',
                                                  'GL',
                                                  'GD',
                                                  'GP',
                                                  'GU',
                                                  'GT',
                                                  'GG',
                                                  'GN',
                                                  'GW',
                                                  'GY',
                                                  'HT',
                                                  'HM',
                                                  'VA',
                                                  'HN',
                                                  'HK',
                                                  'HU',
                                                  'IS',
                                                  'IN',
                                                  'ID',
                                                  'IR',
                                                  'IQ',
                                                  'IE',
                                                  'IM',
                                                  'IL',
                                                  'IT',
                                                  'JM',
                                                  'JP',
                                                  'JE',
                                                  'JO',
                                                  'KZ',
                                                  'KE',
                                                  'KI',
                                                  'KR',
                                                  'KW',
                                                  'KG',
                                                  'LA',
                                                  'LV',
                                                  'LB',
                                                  'LS',
                                                  'LR',
                                                  'LY',
                                                  'LI',
                                                  'LT',
                                                  'LU',
                                                  'MO',
                                                  'MK',
                                                  'MG',
                                                  'MW',
                                                  'MY',
                                                  'MV',
                                                  'ML',
                                                  'MT',
                                                  'MH',
                                                  'MQ',
                                                  'MR',
                                                  'MU',
                                                  'YT',
                                                  'MX',
                                                  'FM',
                                                  'MD',
                                                  'MC',
                                                  'MN',
                                                  'ME',
                                                  'MS',
                                                  'MA',
                                                  'MZ',
                                                  'MM',
                                                  'NA',
                                                  'NR',
                                                  'NP',
                                                  'NL',
                                                  'AN',
                                                  'NC',
                                                  'NZ',
                                                  'NI',
                                                  'NE',
                                                  'NG',
                                                  'NU',
                                                  'NF',
                                                  'MP',
                                                  'NO',
                                                  'OM',
                                                  'PK',
                                                  'PW',
                                                  'PS',
                                                  'PA',
                                                  'PG',
                                                  'PY',
                                                  'PE',
                                                  'PH',
                                                  'PN',
                                                  'PL',
                                                  'PT',
                                                  'PR',
                                                  'QA',
                                                  'RE',
                                                  'RO',
                                                  'RU',
                                                  'RW',
                                                  'BL',
                                                  'SH',
                                                  'KN',
                                                  'LC',
                                                  'MF',
                                                  'PM',
                                                  'VC',
                                                  'WS',
                                                  'SM',
                                                  'ST',
                                                  'SA',
                                                  'SN',
                                                  'SS',
                                                  'RS',
                                                  'SC',
                                                  'SL',
                                                  'SG',
                                                  'SK',
                                                  'SI',
                                                  'SB',
                                                  'SO',
                                                  'ZA',
                                                  'GS',
                                                  'ES',
                                                  'LK',
                                                  'SD',
                                                  'SR',
                                                  'SJ',
                                                  'SZ',
                                                  'SE',
                                                  'CH',
                                                  'SY',
                                                  'TW',
                                                  'TJ',
                                                  'TZ',
                                                  'TH',
                                                  'TL',
                                                  'TG',
                                                  'TK',
                                                  'TO',
                                                  'TT',
                                                  'TN',
                                                  'TR',
                                                  'TM',
                                                  'TC',
                                                  'TV',
                                                  'UG',
                                                  'UA',
                                                  'AE',
                                                  'GB',
                                                  'US',
                                                  'UM',
                                                  'UY',
                                                  'UZ',
                                                  'VU',
                                                  'VE',
                                                  'VN',
                                                  'VG',
                                                  'VI',
                                                  'WF',
                                                  'EH',
                                                  'YE',
                                                  'ZM',
                                                  'ZW',
                                                  'BQ',
                                                  'KP',
                                                  'SX',
                                                ],
                                                example: 'GB',
                                                description:
                                                  'The ISO 3166-1 alpha-2 country code representing the country that this phone number belongs to.',
                                              },
                                            },
                                          },
                                          {
                                            type: 'object',
                                            properties: {
                                              value: {
                                                type: 'string',
                                                description:
                                                  'A raw text field. Values are limited to 10MB.',
                                              },
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  },
                                  required: ['target_object', '[slug_or_id_of_matching_attribute]'],
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    interaction_type: {
                                      type: 'string',
                                      enum: [
                                        'calendar-event',
                                        'call',
                                        'chat-thread',
                                        'email',
                                        'in-person-meeting',
                                        'meeting',
                                      ],
                                      description:
                                        'The type of interaction e.g. calendar or email.',
                                      example: 'email',
                                    },
                                    interacted_at: {
                                      type: 'string',
                                      format: 'date-time',
                                      description: 'When the interaction occurred.',
                                      example: '2023-01-01T15:00:00.000000000Z',
                                    },
                                    owner_actor: {
                                      type: 'object',
                                      description: 'The actor that created this value.',
                                      properties: {
                                        id: {
                                          type: 'string',
                                          description: 'An ID to identify the actor.',
                                          nullable: true,
                                        },
                                        type: {
                                          type: 'string',
                                          enum: ['api-token', 'workspace-member', 'system', 'app'],
                                          nullable: true,
                                          description:
                                            'The type of actor. [Read more information on actor types here](/docs/actors).',
                                        },
                                      },
                                      example: {
                                        type: 'workspace-member',
                                        id: '50cf242c-7fa3-4cad-87d0-75b1af71c57b',
                                      },
                                    },
                                  },
                                  required: ['interaction_type', 'interacted_at', 'owner_actor'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    line_1: {
                                      type: ['string', 'null'],
                                      description:
                                        'The first line of the address. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.',
                                      example: '1 Infinite Loop',
                                    },
                                    line_2: {
                                      type: ['string', 'null'],
                                      description:
                                        'The second line of the address. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.',
                                      example: 'Block 1',
                                    },
                                    line_3: {
                                      type: ['string', 'null'],
                                      description:
                                        'The third line of the address. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.',
                                      example: 'Hilldrop Estate',
                                    },
                                    line_4: {
                                      type: ['string', 'null'],
                                      description:
                                        'The fourth line of the address. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.',
                                      example: 'Westborough',
                                    },
                                    locality: {
                                      type: ['string', 'null'],
                                      description:
                                        'The town, neighborhood or area the location is in.',
                                      example: 'Cupertino',
                                    },
                                    region: {
                                      type: ['string', 'null'],
                                      description:
                                        'The state, county, province or region that the location is in.',
                                      example: 'CA',
                                    },
                                    postcode: {
                                      type: ['string', 'null'],
                                      description:
                                        'The postcode or zip code for the location. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.}',
                                      example: '95014',
                                    },
                                    country_code: {
                                      type: ['string', 'null'],
                                      enum: [
                                        'AF',
                                        'AX',
                                        'AL',
                                        'DZ',
                                        'AS',
                                        'AD',
                                        'AO',
                                        'AI',
                                        'AQ',
                                        'AG',
                                        'AR',
                                        'AM',
                                        'AW',
                                        'AU',
                                        'AT',
                                        'AZ',
                                        'BS',
                                        'BH',
                                        'BD',
                                        'BB',
                                        'BY',
                                        'BE',
                                        'BZ',
                                        'BJ',
                                        'BM',
                                        'BT',
                                        'BO',
                                        'BA',
                                        'BW',
                                        'BV',
                                        'BR',
                                        'IO',
                                        'BN',
                                        'BG',
                                        'BF',
                                        'BI',
                                        'KH',
                                        'CM',
                                        'CA',
                                        'CV',
                                        'KY',
                                        'CF',
                                        'TD',
                                        'CL',
                                        'CN',
                                        'CX',
                                        'CC',
                                        'CO',
                                        'KM',
                                        'CG',
                                        'CD',
                                        'CK',
                                        'CR',
                                        'CI',
                                        'HR',
                                        'CU',
                                        'CW',
                                        'CY',
                                        'CZ',
                                        'DK',
                                        'DJ',
                                        'DM',
                                        'DO',
                                        'EC',
                                        'EG',
                                        'SV',
                                        'GQ',
                                        'ER',
                                        'EE',
                                        'ET',
                                        'FK',
                                        'FO',
                                        'FJ',
                                        'FI',
                                        'FR',
                                        'GF',
                                        'PF',
                                        'TF',
                                        'GA',
                                        'GM',
                                        'GE',
                                        'DE',
                                        'GH',
                                        'GI',
                                        'GR',
                                        'GL',
                                        'GD',
                                        'GP',
                                        'GU',
                                        'GT',
                                        'GG',
                                        'GN',
                                        'GW',
                                        'GY',
                                        'HT',
                                        'HM',
                                        'VA',
                                        'HN',
                                        'HK',
                                        'HU',
                                        'IS',
                                        'IN',
                                        'ID',
                                        'IR',
                                        'IQ',
                                        'IE',
                                        'IM',
                                        'IL',
                                        'IT',
                                        'JM',
                                        'JP',
                                        'JE',
                                        'JO',
                                        'KZ',
                                        'KE',
                                        'KI',
                                        'KR',
                                        'KW',
                                        'KG',
                                        'LA',
                                        'LV',
                                        'LB',
                                        'LS',
                                        'LR',
                                        'LY',
                                        'LI',
                                        'LT',
                                        'LU',
                                        'MO',
                                        'MK',
                                        'MG',
                                        'MW',
                                        'MY',
                                        'MV',
                                        'ML',
                                        'MT',
                                        'MH',
                                        'MQ',
                                        'MR',
                                        'MU',
                                        'YT',
                                        'MX',
                                        'FM',
                                        'MD',
                                        'MC',
                                        'MN',
                                        'ME',
                                        'MS',
                                        'MA',
                                        'MZ',
                                        'MM',
                                        'NA',
                                        'NR',
                                        'NP',
                                        'NL',
                                        'AN',
                                        'NC',
                                        'NZ',
                                        'NI',
                                        'NE',
                                        'NG',
                                        'NU',
                                        'NF',
                                        'MP',
                                        'NO',
                                        'OM',
                                        'PK',
                                        'PW',
                                        'PS',
                                        'PA',
                                        'PG',
                                        'PY',
                                        'PE',
                                        'PH',
                                        'PN',
                                        'PL',
                                        'PT',
                                        'PR',
                                        'QA',
                                        'RE',
                                        'RO',
                                        'RU',
                                        'RW',
                                        'BL',
                                        'SH',
                                        'KN',
                                        'LC',
                                        'MF',
                                        'PM',
                                        'VC',
                                        'WS',
                                        'SM',
                                        'ST',
                                        'SA',
                                        'SN',
                                        'SS',
                                        'RS',
                                        'SC',
                                        'SL',
                                        'SG',
                                        'SK',
                                        'SI',
                                        'SB',
                                        'SO',
                                        'ZA',
                                        'GS',
                                        'ES',
                                        'LK',
                                        'SD',
                                        'SR',
                                        'SJ',
                                        'SZ',
                                        'SE',
                                        'CH',
                                        'SY',
                                        'TW',
                                        'TJ',
                                        'TZ',
                                        'TH',
                                        'TL',
                                        'TG',
                                        'TK',
                                        'TO',
                                        'TT',
                                        'TN',
                                        'TR',
                                        'TM',
                                        'TC',
                                        'TV',
                                        'UG',
                                        'UA',
                                        'AE',
                                        'GB',
                                        'US',
                                        'UM',
                                        'UY',
                                        'UZ',
                                        'VU',
                                        'VE',
                                        'VN',
                                        'VG',
                                        'VI',
                                        'WF',
                                        'EH',
                                        'YE',
                                        'ZM',
                                        'ZW',
                                        'BQ',
                                        'KP',
                                        'SX',
                                      ],
                                      description:
                                        'The ISO 3166-1 alpha-2 country code for the country this location is in.',
                                      example: 'US',
                                    },
                                    latitude: {
                                      type: ['string', 'null'],
                                      pattern: '^[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?)$',
                                      description:
                                        'The latitude of the location. Validated by the regular expression `/^[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?)$/`. Values are stored with up to 9 decimal places of precision. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.}',
                                      example: '37.331741',
                                    },
                                    longitude: {
                                      type: ['string', 'null'],
                                      pattern:
                                        '^[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$',
                                      description:
                                        'The longitude of the location. Validated by the regular expression `/^[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$/`. Values are stored with up to 9 decimal places of precision. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.}',
                                      example: '-122.030333',
                                    },
                                  },
                                  required: [
                                    'line_1',
                                    'line_2',
                                    'line_3',
                                    'line_4',
                                    'locality',
                                    'region',
                                    'postcode',
                                    'country_code',
                                    'latitude',
                                    'longitude',
                                  ],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'number',
                                      description: 'Numbers are persisted as 64 bit floats.',
                                      example: 42,
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    first_name: {
                                      type: 'string',
                                      example: 'Ada',
                                      description: 'The first name.',
                                    },
                                    last_name: {
                                      type: 'string',
                                      example: 'Lovelace',
                                      description: 'The last name.',
                                    },
                                    full_name: {
                                      type: 'string',
                                      example: 'Ada Lovelace',
                                      description: 'The full name.',
                                    },
                                  },
                                },
                                {
                                  type: 'object',
                                  required: ['original_phone_number'],
                                  properties: {
                                    original_phone_number: {
                                      type: 'string',
                                      example: '+15558675309',
                                      description:
                                        'A phone number which is either a) prefixed with a country code (e.g. `+44....`) or b) a local number, where `country_code` is specified in addition.',
                                    },
                                    country_code: {
                                      type: ['string', 'null'],
                                      enum: [
                                        'AF',
                                        'AX',
                                        'AL',
                                        'DZ',
                                        'AS',
                                        'AD',
                                        'AO',
                                        'AI',
                                        'AQ',
                                        'AG',
                                        'AR',
                                        'AM',
                                        'AW',
                                        'AU',
                                        'AT',
                                        'AZ',
                                        'BS',
                                        'BH',
                                        'BD',
                                        'BB',
                                        'BY',
                                        'BE',
                                        'BZ',
                                        'BJ',
                                        'BM',
                                        'BT',
                                        'BO',
                                        'BA',
                                        'BW',
                                        'BV',
                                        'BR',
                                        'IO',
                                        'BN',
                                        'BG',
                                        'BF',
                                        'BI',
                                        'KH',
                                        'CM',
                                        'CA',
                                        'CV',
                                        'KY',
                                        'CF',
                                        'TD',
                                        'CL',
                                        'CN',
                                        'CX',
                                        'CC',
                                        'CO',
                                        'KM',
                                        'CG',
                                        'CD',
                                        'CK',
                                        'CR',
                                        'CI',
                                        'HR',
                                        'CU',
                                        'CW',
                                        'CY',
                                        'CZ',
                                        'DK',
                                        'DJ',
                                        'DM',
                                        'DO',
                                        'EC',
                                        'EG',
                                        'SV',
                                        'GQ',
                                        'ER',
                                        'EE',
                                        'ET',
                                        'FK',
                                        'FO',
                                        'FJ',
                                        'FI',
                                        'FR',
                                        'GF',
                                        'PF',
                                        'TF',
                                        'GA',
                                        'GM',
                                        'GE',
                                        'DE',
                                        'GH',
                                        'GI',
                                        'GR',
                                        'GL',
                                        'GD',
                                        'GP',
                                        'GU',
                                        'GT',
                                        'GG',
                                        'GN',
                                        'GW',
                                        'GY',
                                        'HT',
                                        'HM',
                                        'VA',
                                        'HN',
                                        'HK',
                                        'HU',
                                        'IS',
                                        'IN',
                                        'ID',
                                        'IR',
                                        'IQ',
                                        'IE',
                                        'IM',
                                        'IL',
                                        'IT',
                                        'JM',
                                        'JP',
                                        'JE',
                                        'JO',
                                        'KZ',
                                        'KE',
                                        'KI',
                                        'KR',
                                        'KW',
                                        'KG',
                                        'LA',
                                        'LV',
                                        'LB',
                                        'LS',
                                        'LR',
                                        'LY',
                                        'LI',
                                        'LT',
                                        'LU',
                                        'MO',
                                        'MK',
                                        'MG',
                                        'MW',
                                        'MY',
                                        'MV',
                                        'ML',
                                        'MT',
                                        'MH',
                                        'MQ',
                                        'MR',
                                        'MU',
                                        'YT',
                                        'MX',
                                        'FM',
                                        'MD',
                                        'MC',
                                        'MN',
                                        'ME',
                                        'MS',
                                        'MA',
                                        'MZ',
                                        'MM',
                                        'NA',
                                        'NR',
                                        'NP',
                                        'NL',
                                        'AN',
                                        'NC',
                                        'NZ',
                                        'NI',
                                        'NE',
                                        'NG',
                                        'NU',
                                        'NF',
                                        'MP',
                                        'NO',
                                        'OM',
                                        'PK',
                                        'PW',
                                        'PS',
                                        'PA',
                                        'PG',
                                        'PY',
                                        'PE',
                                        'PH',
                                        'PN',
                                        'PL',
                                        'PT',
                                        'PR',
                                        'QA',
                                        'RE',
                                        'RO',
                                        'RU',
                                        'RW',
                                        'BL',
                                        'SH',
                                        'KN',
                                        'LC',
                                        'MF',
                                        'PM',
                                        'VC',
                                        'WS',
                                        'SM',
                                        'ST',
                                        'SA',
                                        'SN',
                                        'SS',
                                        'RS',
                                        'SC',
                                        'SL',
                                        'SG',
                                        'SK',
                                        'SI',
                                        'SB',
                                        'SO',
                                        'ZA',
                                        'GS',
                                        'ES',
                                        'LK',
                                        'SD',
                                        'SR',
                                        'SJ',
                                        'SZ',
                                        'SE',
                                        'CH',
                                        'SY',
                                        'TW',
                                        'TJ',
                                        'TZ',
                                        'TH',
                                        'TL',
                                        'TG',
                                        'TK',
                                        'TO',
                                        'TT',
                                        'TN',
                                        'TR',
                                        'TM',
                                        'TC',
                                        'TV',
                                        'UG',
                                        'UA',
                                        'AE',
                                        'GB',
                                        'US',
                                        'UM',
                                        'UY',
                                        'UZ',
                                        'VU',
                                        'VE',
                                        'VN',
                                        'VG',
                                        'VI',
                                        'WF',
                                        'EH',
                                        'YE',
                                        'ZM',
                                        'ZW',
                                        'BQ',
                                        'KP',
                                        'SX',
                                      ],
                                      example: 'GB',
                                      description:
                                        'The ISO 3166-1 alpha-2 country code representing the country that this phone number belongs to. Optional if `original_phone_number` includes a country code prefix.',
                                    },
                                  },
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    status: {
                                      type: 'string',
                                      minLength: 1,
                                      description:
                                        'The UUID or status title identifying the selected status.',
                                      example: 'In Progress',
                                    },
                                  },
                                  required: ['status'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'number',
                                      description:
                                        'A number between 0 and 5 (inclusive) to represent a star rating.',
                                      example: 3,
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    option: {
                                      type: 'string',
                                      minLength: 1,
                                      description:
                                        'The UUID or select option title identifying the selected select option.',
                                      example: 'Medium',
                                    },
                                  },
                                  required: ['option'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'string',
                                      description: 'A raw text field. Values are limited to 10MB.',
                                      example:
                                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'string',
                                      description:
                                        'A timestamp value represents a single, universal moment in time using an ISO 8601 formatted string. This means that a timestamp consists of a date, a time (with nanosecond precision), and a time zone. Attio will coerce timestamps which do not provide full nanosecond precision and UTC is assumed if no time zone is provided. For example, "2023", "2023-01", "2023-01-02", "2023-01-02T13:00", "2023-01-02T13:00:00", and "2023-01-02T13:00:00.000000000" will all be coerced to "2023-01-02T13:00:00.000000000Z". Timestamps are always returned in UTC. For example, writing a timestamp value using the string "2023-01-02T13:00:00.000000000+02:00" will result in the value "2023-01-02T11:00:00.000000000Z" being returned. The maximum date is "9999-12-31T23:59:59.999999999Z".',
                                      format: 'date',
                                      example: '2023-01-01T15:00:00.000000000Z',
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                              ],
                              description:
                                'A union of possible value types, as required in request bodies.',
                            },
                            example: [{ value: 5 }],
                          },
                        },
                        required: ['type', 'template'],
                      },
                      { type: 'null' },
                    ],
                    description:
                      'The default value for this attribute. Static values are used to directly populate values using their contents. Dynamic values are used to lookup data at the point of creation. For example, you could use a dynamic value to insert a value for the currently logged in user. Which default values are available is dependent on the type of the attribute. Default values are not currently supported on people or company objects.',
                  },
                  config: {
                    type: 'object',
                    properties: {
                      currency: {
                        type: 'object',
                        properties: {
                          default_currency_code: {
                            type: 'string',
                            enum: [
                              'AUD',
                              'BRL',
                              'BEL',
                              'CAD',
                              'CNY',
                              'COP',
                              'CZK',
                              'DKK',
                              'EUR',
                              'HKD',
                              'ISK',
                              'INR',
                              'ILS',
                              'JPY',
                              'KRW',
                              'MYR',
                              'MXN',
                              'NTD',
                              'NZD',
                              'NGN',
                              'NOK',
                              'XPF',
                              'PEN',
                              'PHP',
                              'PLN',
                              'GBP',
                              'SAR',
                              'SGD',
                              'ZAR',
                              'SEK',
                              'CHF',
                              'AED',
                              'USD',
                            ],
                            description:
                              'The ISO4217 code representing the currency that values for this attribute should be stored in.',
                          },
                          display_type: {
                            type: 'string',
                            enum: ['code', 'name', 'narrowSymbol', 'symbol'],
                            description:
                              'How the currency should be displayed across the app. "code" will display the ISO currency code e.g. "USD", "name" will display the localized currency name e.g. "British pound", "narrowSymbol" will display "$1" instead of "US$1" and "symbol" will display a localized currency symbol such as "$".',
                          },
                        },
                        required: ['default_currency_code', 'display_type'],
                        description: 'Configuration available for attributes of type "currency".',
                      },
                      record_reference: {
                        type: 'object',
                        properties: {
                          allowed_objects: {
                            type: 'array',
                            items: { type: 'string' },
                            minItems: 1,
                            description:
                              'A list of slugs or UUIDs to indicate which objects records are allowed to belong to. Leave empty to to allow records from all object types.',
                          },
                        },
                        required: ['allowed_objects'],
                        description:
                          'Configuration available for attributes of type "record-reference".',
                      },
                    },
                  },
                },
                required: [
                  'title',
                  'description',
                  'api_slug',
                  'type',
                  'is_required',
                  'is_unique',
                  'is_multiselect',
                  'config',
                ],
                additionalProperties: false,
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['target', 'identifier', 'requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/{target}/{identifier}/attributes',
      executionParameters: [
        { name: 'target', in: 'path' },
        { name: 'identifier', in: 'path' },
      ],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: [] }],
    },
  ],
  [
    'getv2attributesbyattribute',
    {
      name: 'getv2attributesbyattribute',
      description: `Gets information about a single attribute on either an object or a list.

Required scopes: \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['objects', 'lists'],
            description: 'Whether the attribute is on an object or a list.',
          },
          identifier: {
            type: 'string',
            description: 'A UUID or slug to identify the object or list the attribute belongs to.',
          },
          attribute: { type: 'string', description: 'A UUID or slug to identify the attribute.' },
        },
        required: ['target', 'identifier', 'attribute'],
      },
      method: 'get',
      pathTemplate: '/v2/{target}/{identifier}/attributes/{attribute}',
      executionParameters: [
        { name: 'target', in: 'path' },
        { name: 'identifier', in: 'path' },
        { name: 'attribute', in: 'path' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['object_configuration:read'] }],
    },
  ],
  [
    'patchv2attributesbyattribute',
    {
      name: 'patchv2attributesbyattribute',
      description: `Updates a single attribute on a given object or list.

Required scopes: \`object_configuration:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['objects', 'lists'],
            description: 'Whether the attribute is on an object or a list.',
          },
          identifier: {
            type: 'string',
            description: 'A UUID or slug to identify the object or list the attribute belongs to.',
          },
          attribute: { type: 'string', description: 'A UUID or slug to identify the attribute.' },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description:
                      "The name of the attribute. The title will be visible across Attio's UI.",
                  },
                  description: {
                    type: ['string', 'null'],
                    description: 'A text description for the attribute.',
                  },
                  api_slug: {
                    type: 'string',
                    description:
                      'A unique, human-readable slug to access the attribute through URLs and API calls. Formatted in snake case.',
                  },
                  is_required: {
                    type: 'boolean',
                    description:
                      'When `is_required` is `true`, new records/entries must have a value for this attribute. If `false`, values may be `null`. This value does not affect existing data and you do not need to backfill `null` values if changing `is_required` from `false` to `true`.',
                  },
                  is_unique: {
                    type: 'boolean',
                    description:
                      'Whether or not new values for this attribute must be unique. Uniqueness restrictions are only applied to new data and do not apply retroactively to previously created data.',
                  },
                  default_value: {
                    oneOf: [
                      {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['dynamic'], example: 'dynamic' },
                          template: {
                            anyOf: [
                              {
                                type: 'string',
                                enum: ['current-user'],
                                description:
                                  'For actor reference attributes, you may pass a dynamic value of `"current-user"`. When creating new records or entries, this will cause the actor reference value to be populated with either the workspace member or API token that created the record/entry.',
                                example: 'current-user',
                              },
                              {
                                type: 'string',
                                description:
                                  'Timestamp attributes may use an ISO 8601 duration as a dynamic value. For example, `"P1M"` would set the value to the current time plus one month.',
                                example: 'P1M',
                              },
                              {
                                type: 'string',
                                description:
                                  'Date attributes may use an ISO 8601 duration as a dynamic value. For example, `"P1M"` would set the value to the current time plus one month.',
                                example: 'P1M',
                              },
                            ],
                          },
                        },
                        required: ['type', 'template'],
                      },
                      {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['static'], example: 'static' },
                          template: {
                            type: 'array',
                            items: {
                              anyOf: [
                                {
                                  type: 'object',
                                  properties: {
                                    referenced_actor_type: {
                                      type: 'string',
                                      enum: ['workspace-member'],
                                      description:
                                        'The type of the referenced actor. Currently, only workspace members can be written into actor reference attributes. [Read more information on actor types here](/docs/actors).',
                                      example: 'workspace-member',
                                    },
                                    referenced_actor_id: {
                                      type: 'string',
                                      format: 'uuid',
                                      description: 'The ID of the referenced Actor.',
                                      example: '50cf242c-7fa3-4cad-87d0-75b1af71c57b',
                                    },
                                  },
                                  required: ['referenced_actor_type', 'referenced_actor_id'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    workspace_member_email_address: {
                                      type: 'string',
                                      description:
                                        'Workspace member actors can be referenced by email address as well as actor ID.',
                                      example: 'alice@attio.com',
                                    },
                                  },
                                  required: ['workspace_member_email_address'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'boolean',
                                      description:
                                        "A boolean representing whether the checkbox is checked or not. The string values 'true' and 'false' are also accepted.",
                                      example: true,
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    currency_value: {
                                      type: 'number',
                                      description:
                                        'A numerical representation of the currency value. A decimal with a max of 4 decimal places.',
                                      example: 99,
                                    },
                                  },
                                  required: ['currency_value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'string',
                                      description:
                                        'A date represents a single calendar year, month and day, independent of timezone. If hours, months, seconds or timezones are provided, they will be trimmed. For example, "2023" and "2023-01" will be coerced into "2023-01-01", and "2023-01-02", "2023-01-02T13:00", "2023-01-02T14:00:00", "2023-01-02T15:00:00.000000000", and "2023-01-02T15:00:00.000000000+02:00" will all be coerced to "2023-01-02". If a timezone is provided that would result in a different calendar date in UTC, the date will be coerced to UTC and then the timezone component will be trimmed. For example, the value "2023-01-02T23:00:00-10:00" will be returned as "2023-01-03". The maximum date is "9999-12-31".',
                                      example: '2023-01-01',
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    domain: {
                                      type: 'string',
                                      description: 'The full domain of the website.',
                                      example: 'app.attio.com',
                                    },
                                  },
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    email_address: {
                                      type: 'string',
                                      description: 'An email address string',
                                      example: 'alice@app.attio.com',
                                    },
                                  },
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    target_object: {
                                      type: 'string',
                                      description:
                                        'A UUID or slug to identify the object that the referenced record belongs to.',
                                      example: 'people',
                                    },
                                    target_record_id: {
                                      type: 'string',
                                      format: 'uuid',
                                      description: 'A UUID to identify the referenced record.',
                                      example: '891dcbfc-9141-415d-9b2a-2238a6cc012d',
                                    },
                                  },
                                  required: ['target_object', 'target_record_id'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  example: {
                                    target_object: 'people',
                                    matching_attribute_id_123: [
                                      { value: 'matching_attribute_id_123' },
                                    ],
                                  },
                                  properties: {
                                    target_object: {
                                      type: 'string',
                                      example: 'people',
                                      description:
                                        'A UUID or slug to identify the object that the referenced record belongs to.',
                                    },
                                    '[slug_or_id_of_matching_attribute]': {
                                      type: 'array',
                                      description:
                                        'In addition to referencing records directly by record ID, you may also reference by a matching attribute of your choice. For example, if you want to add a reference to the person record with email "alice@website.com", you should pass a value with `target_object` set to `"people"` and `email_addresses` set to `[{email_address:"alice@website.com"}]`. The key should be the slug or ID of the matching attribute you would like to use and the value should be an array containing a single value of the appropriate attribute type (as specified below). Matching on multiple values is not currently supported. Matching attributes must be unique. This process is similar to how you use the `matching_attribute` query param in Attio\'s [assert endpoints](/rest-api/endpoint-reference/records/assert-a-record).',
                                      items: {
                                        anyOf: [
                                          {
                                            type: 'object',
                                            properties: {
                                              domain: {
                                                type: 'string',
                                                example: 'app.attio.com',
                                                description: 'The full domain of the website.',
                                              },
                                            },
                                          },
                                          {
                                            type: 'object',
                                            properties: {
                                              email_address: {
                                                type: 'string',
                                                example: 'alice@app.attio.com',
                                                description: 'An email address string',
                                              },
                                            },
                                          },
                                          {
                                            type: 'object',
                                            properties: {
                                              value: {
                                                type: 'number',
                                                example: 17224912,
                                                description:
                                                  'Numbers are persisted as 64 bit floats.',
                                              },
                                            },
                                          },
                                          {
                                            type: 'object',
                                            properties: {
                                              original_phone_number: {
                                                type: 'string',
                                                example: '07234172834',
                                                description:
                                                  'The raw, original phone number, as inputted.',
                                              },
                                              country_code: {
                                                type: ['string', 'null'],
                                                enum: [
                                                  'AF',
                                                  'AX',
                                                  'AL',
                                                  'DZ',
                                                  'AS',
                                                  'AD',
                                                  'AO',
                                                  'AI',
                                                  'AQ',
                                                  'AG',
                                                  'AR',
                                                  'AM',
                                                  'AW',
                                                  'AU',
                                                  'AT',
                                                  'AZ',
                                                  'BS',
                                                  'BH',
                                                  'BD',
                                                  'BB',
                                                  'BY',
                                                  'BE',
                                                  'BZ',
                                                  'BJ',
                                                  'BM',
                                                  'BT',
                                                  'BO',
                                                  'BA',
                                                  'BW',
                                                  'BV',
                                                  'BR',
                                                  'IO',
                                                  'BN',
                                                  'BG',
                                                  'BF',
                                                  'BI',
                                                  'KH',
                                                  'CM',
                                                  'CA',
                                                  'CV',
                                                  'KY',
                                                  'CF',
                                                  'TD',
                                                  'CL',
                                                  'CN',
                                                  'CX',
                                                  'CC',
                                                  'CO',
                                                  'KM',
                                                  'CG',
                                                  'CD',
                                                  'CK',
                                                  'CR',
                                                  'CI',
                                                  'HR',
                                                  'CU',
                                                  'CW',
                                                  'CY',
                                                  'CZ',
                                                  'DK',
                                                  'DJ',
                                                  'DM',
                                                  'DO',
                                                  'EC',
                                                  'EG',
                                                  'SV',
                                                  'GQ',
                                                  'ER',
                                                  'EE',
                                                  'ET',
                                                  'FK',
                                                  'FO',
                                                  'FJ',
                                                  'FI',
                                                  'FR',
                                                  'GF',
                                                  'PF',
                                                  'TF',
                                                  'GA',
                                                  'GM',
                                                  'GE',
                                                  'DE',
                                                  'GH',
                                                  'GI',
                                                  'GR',
                                                  'GL',
                                                  'GD',
                                                  'GP',
                                                  'GU',
                                                  'GT',
                                                  'GG',
                                                  'GN',
                                                  'GW',
                                                  'GY',
                                                  'HT',
                                                  'HM',
                                                  'VA',
                                                  'HN',
                                                  'HK',
                                                  'HU',
                                                  'IS',
                                                  'IN',
                                                  'ID',
                                                  'IR',
                                                  'IQ',
                                                  'IE',
                                                  'IM',
                                                  'IL',
                                                  'IT',
                                                  'JM',
                                                  'JP',
                                                  'JE',
                                                  'JO',
                                                  'KZ',
                                                  'KE',
                                                  'KI',
                                                  'KR',
                                                  'KW',
                                                  'KG',
                                                  'LA',
                                                  'LV',
                                                  'LB',
                                                  'LS',
                                                  'LR',
                                                  'LY',
                                                  'LI',
                                                  'LT',
                                                  'LU',
                                                  'MO',
                                                  'MK',
                                                  'MG',
                                                  'MW',
                                                  'MY',
                                                  'MV',
                                                  'ML',
                                                  'MT',
                                                  'MH',
                                                  'MQ',
                                                  'MR',
                                                  'MU',
                                                  'YT',
                                                  'MX',
                                                  'FM',
                                                  'MD',
                                                  'MC',
                                                  'MN',
                                                  'ME',
                                                  'MS',
                                                  'MA',
                                                  'MZ',
                                                  'MM',
                                                  'NA',
                                                  'NR',
                                                  'NP',
                                                  'NL',
                                                  'AN',
                                                  'NC',
                                                  'NZ',
                                                  'NI',
                                                  'NE',
                                                  'NG',
                                                  'NU',
                                                  'NF',
                                                  'MP',
                                                  'NO',
                                                  'OM',
                                                  'PK',
                                                  'PW',
                                                  'PS',
                                                  'PA',
                                                  'PG',
                                                  'PY',
                                                  'PE',
                                                  'PH',
                                                  'PN',
                                                  'PL',
                                                  'PT',
                                                  'PR',
                                                  'QA',
                                                  'RE',
                                                  'RO',
                                                  'RU',
                                                  'RW',
                                                  'BL',
                                                  'SH',
                                                  'KN',
                                                  'LC',
                                                  'MF',
                                                  'PM',
                                                  'VC',
                                                  'WS',
                                                  'SM',
                                                  'ST',
                                                  'SA',
                                                  'SN',
                                                  'SS',
                                                  'RS',
                                                  'SC',
                                                  'SL',
                                                  'SG',
                                                  'SK',
                                                  'SI',
                                                  'SB',
                                                  'SO',
                                                  'ZA',
                                                  'GS',
                                                  'ES',
                                                  'LK',
                                                  'SD',
                                                  'SR',
                                                  'SJ',
                                                  'SZ',
                                                  'SE',
                                                  'CH',
                                                  'SY',
                                                  'TW',
                                                  'TJ',
                                                  'TZ',
                                                  'TH',
                                                  'TL',
                                                  'TG',
                                                  'TK',
                                                  'TO',
                                                  'TT',
                                                  'TN',
                                                  'TR',
                                                  'TM',
                                                  'TC',
                                                  'TV',
                                                  'UG',
                                                  'UA',
                                                  'AE',
                                                  'GB',
                                                  'US',
                                                  'UM',
                                                  'UY',
                                                  'UZ',
                                                  'VU',
                                                  'VE',
                                                  'VN',
                                                  'VG',
                                                  'VI',
                                                  'WF',
                                                  'EH',
                                                  'YE',
                                                  'ZM',
                                                  'ZW',
                                                  'BQ',
                                                  'KP',
                                                  'SX',
                                                ],
                                                example: 'GB',
                                                description:
                                                  'The ISO 3166-1 alpha-2 country code representing the country that this phone number belongs to.',
                                              },
                                            },
                                          },
                                          {
                                            type: 'object',
                                            properties: {
                                              value: {
                                                type: 'string',
                                                description:
                                                  'A raw text field. Values are limited to 10MB.',
                                              },
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  },
                                  required: ['target_object', '[slug_or_id_of_matching_attribute]'],
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    interaction_type: {
                                      type: 'string',
                                      enum: [
                                        'calendar-event',
                                        'call',
                                        'chat-thread',
                                        'email',
                                        'in-person-meeting',
                                        'meeting',
                                      ],
                                      description:
                                        'The type of interaction e.g. calendar or email.',
                                      example: 'email',
                                    },
                                    interacted_at: {
                                      type: 'string',
                                      format: 'date-time',
                                      description: 'When the interaction occurred.',
                                      example: '2023-01-01T15:00:00.000000000Z',
                                    },
                                    owner_actor: {
                                      type: 'object',
                                      description: 'The actor that created this value.',
                                      properties: {
                                        id: {
                                          type: 'string',
                                          description: 'An ID to identify the actor.',
                                          nullable: true,
                                        },
                                        type: {
                                          type: 'string',
                                          enum: ['api-token', 'workspace-member', 'system', 'app'],
                                          nullable: true,
                                          description:
                                            'The type of actor. [Read more information on actor types here](/docs/actors).',
                                        },
                                      },
                                      example: {
                                        type: 'workspace-member',
                                        id: '50cf242c-7fa3-4cad-87d0-75b1af71c57b',
                                      },
                                    },
                                  },
                                  required: ['interaction_type', 'interacted_at', 'owner_actor'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    line_1: {
                                      type: ['string', 'null'],
                                      description:
                                        'The first line of the address. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.',
                                      example: '1 Infinite Loop',
                                    },
                                    line_2: {
                                      type: ['string', 'null'],
                                      description:
                                        'The second line of the address. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.',
                                      example: 'Block 1',
                                    },
                                    line_3: {
                                      type: ['string', 'null'],
                                      description:
                                        'The third line of the address. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.',
                                      example: 'Hilldrop Estate',
                                    },
                                    line_4: {
                                      type: ['string', 'null'],
                                      description:
                                        'The fourth line of the address. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.',
                                      example: 'Westborough',
                                    },
                                    locality: {
                                      type: ['string', 'null'],
                                      description:
                                        'The town, neighborhood or area the location is in.',
                                      example: 'Cupertino',
                                    },
                                    region: {
                                      type: ['string', 'null'],
                                      description:
                                        'The state, county, province or region that the location is in.',
                                      example: 'CA',
                                    },
                                    postcode: {
                                      type: ['string', 'null'],
                                      description:
                                        'The postcode or zip code for the location. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.}',
                                      example: '95014',
                                    },
                                    country_code: {
                                      type: ['string', 'null'],
                                      enum: [
                                        'AF',
                                        'AX',
                                        'AL',
                                        'DZ',
                                        'AS',
                                        'AD',
                                        'AO',
                                        'AI',
                                        'AQ',
                                        'AG',
                                        'AR',
                                        'AM',
                                        'AW',
                                        'AU',
                                        'AT',
                                        'AZ',
                                        'BS',
                                        'BH',
                                        'BD',
                                        'BB',
                                        'BY',
                                        'BE',
                                        'BZ',
                                        'BJ',
                                        'BM',
                                        'BT',
                                        'BO',
                                        'BA',
                                        'BW',
                                        'BV',
                                        'BR',
                                        'IO',
                                        'BN',
                                        'BG',
                                        'BF',
                                        'BI',
                                        'KH',
                                        'CM',
                                        'CA',
                                        'CV',
                                        'KY',
                                        'CF',
                                        'TD',
                                        'CL',
                                        'CN',
                                        'CX',
                                        'CC',
                                        'CO',
                                        'KM',
                                        'CG',
                                        'CD',
                                        'CK',
                                        'CR',
                                        'CI',
                                        'HR',
                                        'CU',
                                        'CW',
                                        'CY',
                                        'CZ',
                                        'DK',
                                        'DJ',
                                        'DM',
                                        'DO',
                                        'EC',
                                        'EG',
                                        'SV',
                                        'GQ',
                                        'ER',
                                        'EE',
                                        'ET',
                                        'FK',
                                        'FO',
                                        'FJ',
                                        'FI',
                                        'FR',
                                        'GF',
                                        'PF',
                                        'TF',
                                        'GA',
                                        'GM',
                                        'GE',
                                        'DE',
                                        'GH',
                                        'GI',
                                        'GR',
                                        'GL',
                                        'GD',
                                        'GP',
                                        'GU',
                                        'GT',
                                        'GG',
                                        'GN',
                                        'GW',
                                        'GY',
                                        'HT',
                                        'HM',
                                        'VA',
                                        'HN',
                                        'HK',
                                        'HU',
                                        'IS',
                                        'IN',
                                        'ID',
                                        'IR',
                                        'IQ',
                                        'IE',
                                        'IM',
                                        'IL',
                                        'IT',
                                        'JM',
                                        'JP',
                                        'JE',
                                        'JO',
                                        'KZ',
                                        'KE',
                                        'KI',
                                        'KR',
                                        'KW',
                                        'KG',
                                        'LA',
                                        'LV',
                                        'LB',
                                        'LS',
                                        'LR',
                                        'LY',
                                        'LI',
                                        'LT',
                                        'LU',
                                        'MO',
                                        'MK',
                                        'MG',
                                        'MW',
                                        'MY',
                                        'MV',
                                        'ML',
                                        'MT',
                                        'MH',
                                        'MQ',
                                        'MR',
                                        'MU',
                                        'YT',
                                        'MX',
                                        'FM',
                                        'MD',
                                        'MC',
                                        'MN',
                                        'ME',
                                        'MS',
                                        'MA',
                                        'MZ',
                                        'MM',
                                        'NA',
                                        'NR',
                                        'NP',
                                        'NL',
                                        'AN',
                                        'NC',
                                        'NZ',
                                        'NI',
                                        'NE',
                                        'NG',
                                        'NU',
                                        'NF',
                                        'MP',
                                        'NO',
                                        'OM',
                                        'PK',
                                        'PW',
                                        'PS',
                                        'PA',
                                        'PG',
                                        'PY',
                                        'PE',
                                        'PH',
                                        'PN',
                                        'PL',
                                        'PT',
                                        'PR',
                                        'QA',
                                        'RE',
                                        'RO',
                                        'RU',
                                        'RW',
                                        'BL',
                                        'SH',
                                        'KN',
                                        'LC',
                                        'MF',
                                        'PM',
                                        'VC',
                                        'WS',
                                        'SM',
                                        'ST',
                                        'SA',
                                        'SN',
                                        'SS',
                                        'RS',
                                        'SC',
                                        'SL',
                                        'SG',
                                        'SK',
                                        'SI',
                                        'SB',
                                        'SO',
                                        'ZA',
                                        'GS',
                                        'ES',
                                        'LK',
                                        'SD',
                                        'SR',
                                        'SJ',
                                        'SZ',
                                        'SE',
                                        'CH',
                                        'SY',
                                        'TW',
                                        'TJ',
                                        'TZ',
                                        'TH',
                                        'TL',
                                        'TG',
                                        'TK',
                                        'TO',
                                        'TT',
                                        'TN',
                                        'TR',
                                        'TM',
                                        'TC',
                                        'TV',
                                        'UG',
                                        'UA',
                                        'AE',
                                        'GB',
                                        'US',
                                        'UM',
                                        'UY',
                                        'UZ',
                                        'VU',
                                        'VE',
                                        'VN',
                                        'VG',
                                        'VI',
                                        'WF',
                                        'EH',
                                        'YE',
                                        'ZM',
                                        'ZW',
                                        'BQ',
                                        'KP',
                                        'SX',
                                      ],
                                      description:
                                        'The ISO 3166-1 alpha-2 country code for the country this location is in.',
                                      example: 'US',
                                    },
                                    latitude: {
                                      type: ['string', 'null'],
                                      pattern: '^[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?)$',
                                      description:
                                        'The latitude of the location. Validated by the regular expression `/^[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?)$/`. Values are stored with up to 9 decimal places of precision. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.}',
                                      example: '37.331741',
                                    },
                                    longitude: {
                                      type: ['string', 'null'],
                                      pattern:
                                        '^[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$',
                                      description:
                                        'The longitude of the location. Validated by the regular expression `/^[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$/`. Values are stored with up to 9 decimal places of precision. Note that this value is not currently represented in the UI but will be persisted and readable through API calls.}',
                                      example: '-122.030333',
                                    },
                                  },
                                  required: [
                                    'line_1',
                                    'line_2',
                                    'line_3',
                                    'line_4',
                                    'locality',
                                    'region',
                                    'postcode',
                                    'country_code',
                                    'latitude',
                                    'longitude',
                                  ],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'number',
                                      description: 'Numbers are persisted as 64 bit floats.',
                                      example: 42,
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    first_name: {
                                      type: 'string',
                                      example: 'Ada',
                                      description: 'The first name.',
                                    },
                                    last_name: {
                                      type: 'string',
                                      example: 'Lovelace',
                                      description: 'The last name.',
                                    },
                                    full_name: {
                                      type: 'string',
                                      example: 'Ada Lovelace',
                                      description: 'The full name.',
                                    },
                                  },
                                },
                                {
                                  type: 'object',
                                  required: ['original_phone_number'],
                                  properties: {
                                    original_phone_number: {
                                      type: 'string',
                                      example: '+15558675309',
                                      description:
                                        'A phone number which is either a) prefixed with a country code (e.g. `+44....`) or b) a local number, where `country_code` is specified in addition.',
                                    },
                                    country_code: {
                                      type: ['string', 'null'],
                                      enum: [
                                        'AF',
                                        'AX',
                                        'AL',
                                        'DZ',
                                        'AS',
                                        'AD',
                                        'AO',
                                        'AI',
                                        'AQ',
                                        'AG',
                                        'AR',
                                        'AM',
                                        'AW',
                                        'AU',
                                        'AT',
                                        'AZ',
                                        'BS',
                                        'BH',
                                        'BD',
                                        'BB',
                                        'BY',
                                        'BE',
                                        'BZ',
                                        'BJ',
                                        'BM',
                                        'BT',
                                        'BO',
                                        'BA',
                                        'BW',
                                        'BV',
                                        'BR',
                                        'IO',
                                        'BN',
                                        'BG',
                                        'BF',
                                        'BI',
                                        'KH',
                                        'CM',
                                        'CA',
                                        'CV',
                                        'KY',
                                        'CF',
                                        'TD',
                                        'CL',
                                        'CN',
                                        'CX',
                                        'CC',
                                        'CO',
                                        'KM',
                                        'CG',
                                        'CD',
                                        'CK',
                                        'CR',
                                        'CI',
                                        'HR',
                                        'CU',
                                        'CW',
                                        'CY',
                                        'CZ',
                                        'DK',
                                        'DJ',
                                        'DM',
                                        'DO',
                                        'EC',
                                        'EG',
                                        'SV',
                                        'GQ',
                                        'ER',
                                        'EE',
                                        'ET',
                                        'FK',
                                        'FO',
                                        'FJ',
                                        'FI',
                                        'FR',
                                        'GF',
                                        'PF',
                                        'TF',
                                        'GA',
                                        'GM',
                                        'GE',
                                        'DE',
                                        'GH',
                                        'GI',
                                        'GR',
                                        'GL',
                                        'GD',
                                        'GP',
                                        'GU',
                                        'GT',
                                        'GG',
                                        'GN',
                                        'GW',
                                        'GY',
                                        'HT',
                                        'HM',
                                        'VA',
                                        'HN',
                                        'HK',
                                        'HU',
                                        'IS',
                                        'IN',
                                        'ID',
                                        'IR',
                                        'IQ',
                                        'IE',
                                        'IM',
                                        'IL',
                                        'IT',
                                        'JM',
                                        'JP',
                                        'JE',
                                        'JO',
                                        'KZ',
                                        'KE',
                                        'KI',
                                        'KR',
                                        'KW',
                                        'KG',
                                        'LA',
                                        'LV',
                                        'LB',
                                        'LS',
                                        'LR',
                                        'LY',
                                        'LI',
                                        'LT',
                                        'LU',
                                        'MO',
                                        'MK',
                                        'MG',
                                        'MW',
                                        'MY',
                                        'MV',
                                        'ML',
                                        'MT',
                                        'MH',
                                        'MQ',
                                        'MR',
                                        'MU',
                                        'YT',
                                        'MX',
                                        'FM',
                                        'MD',
                                        'MC',
                                        'MN',
                                        'ME',
                                        'MS',
                                        'MA',
                                        'MZ',
                                        'MM',
                                        'NA',
                                        'NR',
                                        'NP',
                                        'NL',
                                        'AN',
                                        'NC',
                                        'NZ',
                                        'NI',
                                        'NE',
                                        'NG',
                                        'NU',
                                        'NF',
                                        'MP',
                                        'NO',
                                        'OM',
                                        'PK',
                                        'PW',
                                        'PS',
                                        'PA',
                                        'PG',
                                        'PY',
                                        'PE',
                                        'PH',
                                        'PN',
                                        'PL',
                                        'PT',
                                        'PR',
                                        'QA',
                                        'RE',
                                        'RO',
                                        'RU',
                                        'RW',
                                        'BL',
                                        'SH',
                                        'KN',
                                        'LC',
                                        'MF',
                                        'PM',
                                        'VC',
                                        'WS',
                                        'SM',
                                        'ST',
                                        'SA',
                                        'SN',
                                        'SS',
                                        'RS',
                                        'SC',
                                        'SL',
                                        'SG',
                                        'SK',
                                        'SI',
                                        'SB',
                                        'SO',
                                        'ZA',
                                        'GS',
                                        'ES',
                                        'LK',
                                        'SD',
                                        'SR',
                                        'SJ',
                                        'SZ',
                                        'SE',
                                        'CH',
                                        'SY',
                                        'TW',
                                        'TJ',
                                        'TZ',
                                        'TH',
                                        'TL',
                                        'TG',
                                        'TK',
                                        'TO',
                                        'TT',
                                        'TN',
                                        'TR',
                                        'TM',
                                        'TC',
                                        'TV',
                                        'UG',
                                        'UA',
                                        'AE',
                                        'GB',
                                        'US',
                                        'UM',
                                        'UY',
                                        'UZ',
                                        'VU',
                                        'VE',
                                        'VN',
                                        'VG',
                                        'VI',
                                        'WF',
                                        'EH',
                                        'YE',
                                        'ZM',
                                        'ZW',
                                        'BQ',
                                        'KP',
                                        'SX',
                                      ],
                                      example: 'GB',
                                      description:
                                        'The ISO 3166-1 alpha-2 country code representing the country that this phone number belongs to. Optional if `original_phone_number` includes a country code prefix.',
                                    },
                                  },
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    status: {
                                      type: 'string',
                                      minLength: 1,
                                      description:
                                        'The UUID or status title identifying the selected status.',
                                      example: 'In Progress',
                                    },
                                  },
                                  required: ['status'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'number',
                                      description:
                                        'A number between 0 and 5 (inclusive) to represent a star rating.',
                                      example: 3,
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    option: {
                                      type: 'string',
                                      minLength: 1,
                                      description:
                                        'The UUID or select option title identifying the selected select option.',
                                      example: 'Medium',
                                    },
                                  },
                                  required: ['option'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'string',
                                      description: 'A raw text field. Values are limited to 10MB.',
                                      example:
                                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    value: {
                                      type: 'string',
                                      description:
                                        'A timestamp value represents a single, universal moment in time using an ISO 8601 formatted string. This means that a timestamp consists of a date, a time (with nanosecond precision), and a time zone. Attio will coerce timestamps which do not provide full nanosecond precision and UTC is assumed if no time zone is provided. For example, "2023", "2023-01", "2023-01-02", "2023-01-02T13:00", "2023-01-02T13:00:00", and "2023-01-02T13:00:00.000000000" will all be coerced to "2023-01-02T13:00:00.000000000Z". Timestamps are always returned in UTC. For example, writing a timestamp value using the string "2023-01-02T13:00:00.000000000+02:00" will result in the value "2023-01-02T11:00:00.000000000Z" being returned. The maximum date is "9999-12-31T23:59:59.999999999Z".',
                                      format: 'date',
                                      example: '2023-01-01T15:00:00.000000000Z',
                                    },
                                  },
                                  required: ['value'],
                                  additionalProperties: false,
                                },
                              ],
                              description:
                                'A union of possible value types, as required in request bodies.',
                            },
                            example: [{ value: 5 }],
                          },
                        },
                        required: ['type', 'template'],
                      },
                      { type: 'null' },
                    ],
                    description:
                      'The default value for this attribute. Static values are used to directly populate values using their contents. Dynamic values are used to lookup data at the point of creation. For example, you could use a dynamic value to insert a value for the currently logged in user. Which default values are available is dependent on the type of the attribute. Default values are not currently supported on people or company objects.',
                  },
                  config: {
                    type: 'object',
                    properties: {
                      currency: {
                        type: 'object',
                        properties: {
                          default_currency_code: {
                            type: 'string',
                            enum: [
                              'AUD',
                              'BRL',
                              'BEL',
                              'CAD',
                              'CNY',
                              'COP',
                              'CZK',
                              'DKK',
                              'EUR',
                              'HKD',
                              'ISK',
                              'INR',
                              'ILS',
                              'JPY',
                              'KRW',
                              'MYR',
                              'MXN',
                              'NTD',
                              'NZD',
                              'NGN',
                              'NOK',
                              'XPF',
                              'PEN',
                              'PHP',
                              'PLN',
                              'GBP',
                              'SAR',
                              'SGD',
                              'ZAR',
                              'SEK',
                              'CHF',
                              'AED',
                              'USD',
                            ],
                            description:
                              'The ISO4217 code representing the currency that values for this attribute should be stored in.',
                          },
                          display_type: {
                            type: 'string',
                            enum: ['code', 'name', 'narrowSymbol', 'symbol'],
                            description:
                              'How the currency should be displayed across the app. "code" will display the ISO currency code e.g. "USD", "name" will display the localized currency name e.g. "British pound", "narrowSymbol" will display "$1" instead of "US$1" and "symbol" will display a localized currency symbol such as "$".',
                          },
                        },
                        required: ['default_currency_code', 'display_type'],
                        description: 'Configuration available for attributes of type "currency".',
                      },
                      record_reference: {
                        type: 'object',
                        properties: {
                          allowed_objects: {
                            type: 'array',
                            items: { type: 'string' },
                            minItems: 1,
                            description:
                              'A list of slugs or UUIDs to indicate which objects records are allowed to belong to. Leave empty to to allow records from all object types.',
                          },
                        },
                        required: ['allowed_objects'],
                        description:
                          'Configuration available for attributes of type "record-reference".',
                      },
                    },
                    description: 'Additional, type-dependent configuration for the attribute.',
                  },
                  is_archived: {
                    type: 'boolean',
                    description:
                      'Whether the attribute has been archived or not. See our [archiving guide](/docs/archiving-vs-deleting) for more information on archiving.',
                  },
                },
                additionalProperties: false,
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['target', 'identifier', 'attribute', 'requestBody'],
      },
      method: 'patch',
      pathTemplate: '/v2/{target}/{identifier}/attributes/{attribute}',
      executionParameters: [
        { name: 'target', in: 'path' },
        { name: 'identifier', in: 'path' },
        { name: 'attribute', in: 'path' },
      ],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['object_configuration:read-write'] }],
    },
  ],
  [
    'getv2attributesoptions',
    {
      name: 'getv2attributesoptions',
      description: `Lists all select options for a particular attribute on either an object or a list.

Required scopes: \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['objects', 'lists'],
            description: 'Whether the attribute is on an object or a list.',
          },
          identifier: {
            type: 'string',
            description:
              'A UUID or slug to identify the object or list the select attribute belongs to.',
          },
          attribute: {
            type: 'string',
            description:
              'A UUID or slug to identify the attribute you want to list select options on.',
          },
          show_archived: {
            type: 'boolean',
            description: '`true` if you want the results to include archived select options.',
          },
        },
        required: ['target', 'identifier', 'attribute'],
      },
      method: 'get',
      pathTemplate: '/v2/{target}/{identifier}/attributes/{attribute}/options',
      executionParameters: [
        { name: 'target', in: 'path' },
        { name: 'identifier', in: 'path' },
        { name: 'attribute', in: 'path' },
        { name: 'show_archived', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['object_configuration:read'] }],
    },
  ],
  [
    'postv2attributesoptions',
    {
      name: 'postv2attributesoptions',
      description: `Adds a select option to a select attribute on an object or a list.

Required scopes: \`object_configuration:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['objects', 'lists'],
            description: 'Whether the attribute is on an object or a list.',
          },
          identifier: {
            type: 'string',
            description:
              'A UUID or slug to identify the object or list the select attribute belongs to.',
          },
          attribute: {
            type: 'string',
            description: 'A UUID or slug to identify the attribute to create a select option on.',
          },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    minLength: 1,
                    description: 'The Title of the select option',
                  },
                },
                required: ['title'],
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['target', 'identifier', 'attribute', 'requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/{target}/{identifier}/attributes/{attribute}/options',
      executionParameters: [
        { name: 'target', in: 'path' },
        { name: 'identifier', in: 'path' },
        { name: 'attribute', in: 'path' },
      ],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['object_configuration:read-write'] }],
    },
  ],
  [
    'patchv2attributesoptionsbyoption',
    {
      name: 'patchv2attributesoptionsbyoption',
      description: `Updates a select option on an attribute on either an object or a list.

Required scopes: \`object_configuration:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['objects', 'lists'],
            description: 'Whether the attribute is on an object or a list.',
          },
          identifier: {
            type: 'string',
            description:
              'A UUID or slug to identify the object or list the select attribute belongs to.',
          },
          attribute: {
            type: 'string',
            description: 'A UUID or slug to identify the select attribute.',
          },
          option: {
            type: 'string',
            description:
              'A UUID or select option title to identify the select option you would like to update.',
          },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    minLength: 1,
                    description: 'The Title of the select option',
                  },
                  is_archived: {
                    type: 'boolean',
                    description:
                      'Whether or not to archive the select option. See our [archiving guide](/docs/archiving-vs-deleting) for more information on archiving.',
                  },
                },
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['target', 'identifier', 'attribute', 'option', 'requestBody'],
      },
      method: 'patch',
      pathTemplate: '/v2/{target}/{identifier}/attributes/{attribute}/options/{option}',
      executionParameters: [
        { name: 'target', in: 'path' },
        { name: 'identifier', in: 'path' },
        { name: 'attribute', in: 'path' },
        { name: 'option', in: 'path' },
      ],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['object_configuration:read-write'] }],
    },
  ],
  [
    'getv2attributesstatuses',
    {
      name: 'getv2attributesstatuses',
      description: `Lists all statuses for a particular status attribute on either an object or a list.

Required scopes: \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['lists', 'objects'],
            description:
              'Whether the attribute is on an object or a list. Please note that the company and people objects do not support status attributes at this time.',
          },
          identifier: {
            type: 'string',
            description:
              'A UUID or slug to identify the object or list the status attribute belongs to.',
          },
          attribute: {
            type: 'string',
            description: 'A UUID or slug to identify the attribute you want to list statuses on.',
          },
          show_archived: {
            type: 'boolean',
            description:
              '`true` if you want the results to include archived statuses. See our [archiving guide](/docs/archiving-vs-deleting) for more information on archiving.',
            default: false,
          },
        },
        required: ['target', 'identifier', 'attribute'],
      },
      method: 'get',
      pathTemplate: '/v2/{target}/{identifier}/attributes/{attribute}/statuses',
      executionParameters: [
        { name: 'target', in: 'path' },
        { name: 'identifier', in: 'path' },
        { name: 'attribute', in: 'path' },
        { name: 'show_archived', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['object_configuration:read'] }],
    },
  ],
  [
    'postv2attributesstatuses',
    {
      name: 'postv2attributesstatuses',
      description: `Add a new status to a status attribute on either an object or a list.

Required scopes: \`object_configuration:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['lists', 'objects'],
            description:
              'Whether the attribute is on an object or a list. Please note that company and person objects do not support status attributes at this time.',
          },
          identifier: {
            type: 'string',
            description:
              'A UUID or slug to identify the object or list the status attribute belongs to.',
          },
          attribute: {
            type: 'string',
            description: 'A UUID or slug to identify the attribute the status will belong to.',
          },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  title: { type: 'string', minLength: 1, description: 'The Title of the status' },
                  celebration_enabled: {
                    type: 'boolean',
                    default: false,
                    description: 'Whether arriving at this status triggers a celebration effect',
                  },
                  target_time_in_status: {
                    type: ['string', 'null'],
                    pattern:
                      'P(?:(\\d+Y)?(\\d+M)?(\\d+W)?(\\d+D)?(?:T(\\d+(?:[\\.,]\\d+)?H)?(\\d+(?:[\\.,]\\d+)?M)?(\\d+(?:[\\.,]\\d+)?S)?)?)',
                    description:
                      'Target time for a record to spend in given status expressed as a ISO-8601 duration string',
                  },
                },
                required: ['title'],
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['target', 'identifier', 'attribute', 'requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/{target}/{identifier}/attributes/{attribute}/statuses',
      executionParameters: [
        { name: 'target', in: 'path' },
        { name: 'identifier', in: 'path' },
        { name: 'attribute', in: 'path' },
      ],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['object_configuration:read-write'] }],
    },
  ],
  [
    'patchv2attributesstatusesbystatus',
    {
      name: 'patchv2attributesstatusesbystatus',
      description: `Update a status on an status attribute on either an object or a list.

Required scopes: \`object_configuration:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['lists', 'objects'],
            description:
              'Whether the attribute is on an object or a list. Please note that company and person objects do not support status attributes at this time.',
          },
          identifier: {
            type: 'string',
            description:
              'A UUID or slug to identify the object or list the status attribute belongs to.',
          },
          attribute: {
            type: 'string',
            description: 'A UUID or slug to identify the attribute to update the status on.',
          },
          status: {
            type: 'string',
            description: 'A UUID or status title to identify the status to update.',
          },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  title: { type: 'string', minLength: 1, description: 'The Title of the status' },
                  celebration_enabled: {
                    type: 'boolean',
                    default: false,
                    description: 'Whether arriving at this status triggers a celebration effect',
                  },
                  target_time_in_status: {
                    type: ['string', 'null'],
                    pattern:
                      'P(?:(\\d+Y)?(\\d+M)?(\\d+W)?(\\d+D)?(?:T(\\d+(?:[\\.,]\\d+)?H)?(\\d+(?:[\\.,]\\d+)?M)?(\\d+(?:[\\.,]\\d+)?S)?)?)',
                    description:
                      'Target time for a record to spend in given status expressed as a ISO-8601 duration string',
                  },
                  is_archived: {
                    type: 'boolean',
                    description:
                      'Whether or not to archive the status. See our [archiving guide](/docs/archiving-vs-deleting) for more information on archiving.',
                  },
                },
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['target', 'identifier', 'attribute', 'status', 'requestBody'],
      },
      method: 'patch',
      pathTemplate: '/v2/{target}/{identifier}/attributes/{attribute}/statuses/{status}',
      executionParameters: [
        { name: 'target', in: 'path' },
        { name: 'identifier', in: 'path' },
        { name: 'attribute', in: 'path' },
        { name: 'status', in: 'path' },
      ],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['object_configuration:read-write'] }],
    },
  ],
  [
    'postv2objectsrecordsquery',
    {
      name: 'postv2objectsrecordsquery',
      description: `Lists people, company or other records, with the option to filter and sort results.

Required scopes: \`record_permission:read\`, \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          object: {
            type: 'string',
            description: 'A UUID or slug to identify the object to list records for.',
          },
          requestBody: {
            type: 'object',
            properties: {
              filter: {
                type: 'object',
                description:
                  'An object used to filter results to a subset of results. See the [full guide to filtering and sorting here](/rest-api/how-to/filtering-and-sorting).',
                additionalProperties: true,
              },
              sorts: {
                type: 'array',
                items: {
                  anyOf: [
                    {
                      type: 'object',
                      properties: {
                        direction: {
                          type: 'string',
                          enum: ['asc', 'desc'],
                          description: 'The direction to sort the results by.',
                        },
                        attribute: {
                          type: 'string',
                          description: 'A slug or ID to identify the attribute to sort by.',
                        },
                        field: {
                          type: 'string',
                          description:
                            'Which field on the value to sort by e.g. "last_name" on a name value.',
                        },
                      },
                      required: ['direction', 'attribute'],
                      description: 'Sort by attribute',
                    },
                    {
                      type: 'object',
                      properties: {
                        direction: {
                          type: 'string',
                          enum: ['asc', 'desc'],
                          description: 'The direction to sort the results by.',
                        },
                        path: {
                          type: 'array',
                          items: {
                            type: 'array',
                            items: {
                              anyOf: [
                                {
                                  type: 'string',
                                  description: 'The slug or ID of the object e.g. "people".',
                                },
                                {
                                  type: 'string',
                                  description: 'A slug or ID to identify the attribute to sort by.',
                                },
                              ],
                            },
                            minItems: 2,
                            maxItems: 2,
                          },
                          description:
                            "You may use the `path` property to traverse record reference attributes and parent records on list entries. `path` accepts an array of tuples where the first element of each tuple is the slug or ID of a list/object, and the second element is the slug or ID of an attribute on that list/object. The first element of the first tuple must correspond to the list or object that you are querying. For example, if you wanted to sort by the name of the parent record (a company) on a list with the slug \"sales\", you would pass the value `[['sales', 'parent_record'], ['companies', 'name']]`.",
                        },
                        field: {
                          type: 'string',
                          description:
                            'Which field on the value to sort by e.g. "last_name" on a name value.',
                        },
                      },
                      required: ['direction', 'path'],
                      description: 'Sort by path',
                    },
                  ],
                },
                description:
                  'An object used to sort results. See the [full guide to filtering and sorting here](/rest-api/how-to/filtering-and-sorting).',
              },
              limit: {
                type: 'number',
                description:
                  'The maximum number of results to return. Defaults to 500. See the [full guide to pagination here](/rest-api/how-to/pagination).',
              },
              offset: {
                type: 'number',
                description:
                  'The number of results to skip over before returning. Defaults to 0. See the [full guide to pagination here](/rest-api/how-to/pagination).',
              },
            },
            description: 'The JSON request body.',
          },
        },
        required: ['object', 'requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/objects/{object}/records/query',
      executionParameters: [{ name: 'object', in: 'path' }],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['record_permission:read', 'object_configuration:read'] }],
    },
  ],
  [
    'putv2objectsrecords',
    {
      name: 'putv2objectsrecords',
      description: `Use this endpoint to create or update people, companies and other records. A matching attribute is used to search for existing records. If a record is found with the same value for the matching attribute, that record will be updated. If no record with the same value for the matching attribute is found, a new record will be created instead. If you would like to avoid matching, please use the [Create record endpoint](/rest-api/endpoint-reference/records/create-a-record).

If the matching attribute is a multiselect attribute, new values will be added and existing values will not be deleted. For any other multiselect attribute, all values will be either created or deleted as necessary to match the list of supplied values.

Required scopes: \`record_permission:read-write\`, \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          object: {
            type: 'string',
            description: 'A UUID or slug to identify the object the record should belong to.',
          },
          matching_attribute: {
            type: 'string',
            description:
              'The ID or slug of the attribute to use to check if a record already exists. The attribute must be unique.',
          },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  values: {
                    type: 'object',
                    description:
                      'An object with an attribute `api_slug` or `attribute_id` as the key, and a single value (for single-select attributes), or an array of values (for single or multi-select attributes) as the values. For complete documentation on values for all attribute types, please see our [attribute type docs](/docs/attribute-types).',
                    additionalProperties: { type: 'array' },
                  },
                },
                required: ['values'],
                additionalProperties: false,
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['object', 'matching_attribute', 'requestBody'],
      },
      method: 'put',
      pathTemplate: '/v2/objects/{object}/records',
      executionParameters: [
        { name: 'object', in: 'path' },
        { name: 'matching_attribute', in: 'query' },
      ],
      requestBodyContentType: 'application/json',
      securityRequirements: [
        { oauth2: ['record_permission:read-write', 'object_configuration:read'] },
      ],
    },
  ],
  [
    'postv2objectsrecords',
    {
      name: 'postv2objectsrecords',
      description: `Creates a new person, company or other record. This endpoint will throw on conflicts of unique attributes. If you would prefer to update records on conflicts, please use the [Assert record endpoint](/rest-api/endpoint-reference/records/assert-a-record) instead.

Required scopes: \`record_permission:read-write\`, \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          object: {
            type: 'string',
            description:
              'The UUID or slug identifying the object the created record should belong to.',
          },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  values: {
                    type: 'object',
                    description:
                      'An object with an attribute `api_slug` or `attribute_id` as the key, and a single value (for single-select attributes), or an array of values (for single or multi-select attributes) as the values. For complete documentation on values for all attribute types, please see our [attribute type docs](/docs/attribute-types).',
                    additionalProperties: { type: 'array' },
                  },
                },
                required: ['values'],
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['object', 'requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/objects/{object}/records',
      executionParameters: [{ name: 'object', in: 'path' }],
      requestBodyContentType: 'application/json',
      securityRequirements: [
        { oauth2: ['record_permission:read-write', 'object_configuration:read'] },
      ],
    },
  ],
  [
    'getv2objectsrecordsbyrecordid',
    {
      name: 'getv2objectsrecordsbyrecordid',
      description: `Gets a single person, company or other record by its \`record_id\`.

Required scopes: \`record_permission:read\`, \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          object: {
            type: 'string',
            description: 'A UUID or slug identifying the object that the record belongs to.',
          },
          record_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID identifying the record.',
          },
        },
        required: ['object', 'record_id'],
      },
      method: 'get',
      pathTemplate: '/v2/objects/{object}/records/{record_id}',
      executionParameters: [
        { name: 'object', in: 'path' },
        { name: 'record_id', in: 'path' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['record_permission:read', 'object_configuration:read'] }],
    },
  ],
  [
    'putv2objectsrecordsbyrecordid',
    {
      name: 'putv2objectsrecordsbyrecordid',
      description: `Use this endpoint to update people, companies, and other records by \`record_id\`. If the update payload includes multiselect attributes, the values supplied will overwrite/remove the list of values that already exist (if any). Use the \`PATCH\` endpoint to append multiselect values without removing those that already exist.

Required scopes: \`record_permission:read-write\`, \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          object: {
            type: 'string',
            description: 'A UUID or slug of the object the record belongs to.',
          },
          record_id: { type: 'string', description: 'A UUID of the record to update.' },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  values: {
                    type: 'object',
                    description:
                      'An object with an attribute `api_slug` or `attribute_id` as the key, and a single value (for single-select attributes), or an array of values (for single or multi-select attributes) as the values. For complete documentation on values for all attribute types, please see our [attribute type docs](/docs/attribute-types).',
                    additionalProperties: { type: 'array' },
                  },
                },
                required: ['values'],
                additionalProperties: false,
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['object', 'record_id', 'requestBody'],
      },
      method: 'put',
      pathTemplate: '/v2/objects/{object}/records/{record_id}',
      executionParameters: [
        { name: 'object', in: 'path' },
        { name: 'record_id', in: 'path' },
      ],
      requestBodyContentType: 'application/json',
      securityRequirements: [
        { oauth2: ['record_permission:read-write', 'object_configuration:read'] },
      ],
    },
  ],
  [
    'deletev2objectsrecordsbyrecordid',
    {
      name: 'deletev2objectsrecordsbyrecordid',
      description: `Deletes a single record (e.g. a company or person) by ID.

Required scopes: \`object_configuration:read\`, \`record_permission:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          object: {
            type: 'string',
            description: 'The UUID or slug of the object the record belongs to.',
          },
          record_id: { type: 'string', description: 'The UUID of the record to delete.' },
        },
        required: ['object', 'record_id'],
      },
      method: 'delete',
      pathTemplate: '/v2/objects/{object}/records/{record_id}',
      executionParameters: [
        { name: 'object', in: 'path' },
        { name: 'record_id', in: 'path' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [
        { oauth2: ['object_configuration:read', 'record_permission:read-write'] },
      ],
    },
  ],
  [
    'patchv2objectsrecordsbyrecordid',
    {
      name: 'patchv2objectsrecordsbyrecordid',
      description: `Use this endpoint to update people, companies, and other records by \`record_id\`. If the update payload includes multiselect attributes, the values supplied will be created and prepended to the list of values that already exist (if any). Use the \`PUT\` endpoint to overwrite or remove multiselect attribute values.

Required scopes: \`record_permission:read-write\`, \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          object: {
            type: 'string',
            description: 'A UUID or slug of the object the record belongs to.',
          },
          record_id: { type: 'string', description: 'A UUID of the record to update.' },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  values: {
                    type: 'object',
                    description:
                      'An object with an attribute `api_slug` or `attribute_id` as the key, and a single value (for single-select attributes), or an array of values (for single or multi-select attributes) as the values. For complete documentation on values for all attribute types, please see our [attribute type docs](/docs/attribute-types).',
                    additionalProperties: { type: 'array' },
                  },
                },
                required: ['values'],
                additionalProperties: false,
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['object', 'record_id', 'requestBody'],
      },
      method: 'patch',
      pathTemplate: '/v2/objects/{object}/records/{record_id}',
      executionParameters: [
        { name: 'object', in: 'path' },
        { name: 'record_id', in: 'path' },
      ],
      requestBodyContentType: 'application/json',
      securityRequirements: [
        { oauth2: ['record_permission:read-write', 'object_configuration:read'] },
      ],
    },
  ],
  [
    'getv2objectsrecordsattributesvalues',
    {
      name: 'getv2objectsrecordsattributesvalues',
      description: `Gets all values for a given attribute on a record. If the attribute is historic, this endpoint has the ability to return all historic values using the \`show_historic\` query param.

Required scopes: \`record_permission:read\`, \`object_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          object: {
            type: 'string',
            description: 'A UUID or slug to identify the object the record belongs to.',
          },
          record_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID to identify the record you want to query values on.',
          },
          attribute: {
            type: 'string',
            description: 'A UUID or slug to identify the attribute you want to query values on.',
          },
          show_historic: {
            type: 'boolean',
            description:
              'If `true`, the endpoint will return all historic values for the attribute. If `false`, the endpoint will only return the currently active value(s). Defaults to `false`. Can only be set to `true` for attributes which support historic data; the endpoint will throw if set to `true` for non-historic attributes.',
            default: false,
          },
          limit: {
            type: 'number',
            description:
              'The maximum number of results to return. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
          offset: {
            type: 'number',
            description:
              'The number of results to skip over before returning. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
        },
        required: ['object', 'record_id', 'attribute'],
      },
      method: 'get',
      pathTemplate: '/v2/objects/{object}/records/{record_id}/attributes/{attribute}/values',
      executionParameters: [
        { name: 'object', in: 'path' },
        { name: 'record_id', in: 'path' },
        { name: 'attribute', in: 'path' },
        { name: 'show_historic', in: 'query' },
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['record_permission:read', 'object_configuration:read'] }],
    },
  ],
  [
    'getv2objectsrecordsentries',
    {
      name: 'getv2objectsrecordsentries',
      description: `List all entries, across all lists, for which this record is the parent.

Required scopes: \`record_permission:read\`, \`object_configuration:read\`, \`list_entry:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          object: {
            type: 'string',
            description: 'A UUID or slug identifying the object that the record belongs to.',
          },
          record_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID identifying the record.',
          },
          limit: {
            type: 'number',
            description:
              'The maximum number of results to return. The default is `100` and the maximum is `1000`. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
          offset: {
            type: 'number',
            description:
              'The number of results to skip over before returning. The default is `0`. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
        },
        required: ['object', 'record_id'],
      },
      method: 'get',
      pathTemplate: '/v2/objects/{object}/records/{record_id}/entries',
      executionParameters: [
        { name: 'object', in: 'path' },
        { name: 'record_id', in: 'path' },
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [
        { oauth2: ['record_permission:read', 'object_configuration:read', 'list_entry:read'] },
      ],
    },
  ],
  [
    'getv2lists',
    {
      name: 'getv2lists',
      description: `List all lists that your access token has access to. lists are returned in the order that they are sorted in the sidebar.

Required scopes: \`list_configuration:read\`.`,
      inputSchema: { type: 'object', properties: {} },
      method: 'get',
      pathTemplate: '/v2/lists',
      executionParameters: [],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['list_configuration:read'] }],
    },
  ],
  [
    'postv2lists',
    {
      name: 'postv2lists',
      description: `Creates a new list.

Once you have your list, add attributes to it using the [Create attribute](/rest-api/endpoint-reference/attributes/create-an-attribute) API, and add records to it using the [Add records to list](/rest-api/endpoint-reference/entries/create-an-entry-add-record-to-list) API. 

New lists must specify which records can be added with the \`parent_object\` parameter which accepts either an object slug or an object ID. Permissions for the list are controlled with the \`workspace_access\` and \`workspace_member_access\` parameters.

Please note that new lists must have either \`workspace_access\` set to \`"full-access"\` or one or more element of \`workspace_member_access\` with a \`"full-access"\` level. It is also possible to receive a \`403\` billing error if your workspace is not on a plan that supports either advanced workspace or workspace member-level access for lists.

Required scopes: \`list_configuration:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'The human-readable name of the list.' },
                  api_slug: {
                    type: 'string',
                    description:
                      'A unique, human-readable slug to access the list through API calls. Should be formatted in snake case.',
                  },
                  parent_object: {
                    type: 'string',
                    description:
                      'A UUID or slug to identify the allowed object type for records added to this list.',
                  },
                  workspace_access: {
                    type: ['string', 'null'],
                    enum: ['full-access', 'read-and-write', 'read-only'],
                    description:
                      'The level of access granted to all members of the workspace for this list. Pass `null` to keep the list private and only grant access to specific workspace members.',
                  },
                  workspace_member_access: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        workspace_member_id: {
                          type: 'string',
                          format: 'uuid',
                          description:
                            'A UUID to identify the workspace member to grant access to.',
                        },
                        level: {
                          type: 'string',
                          enum: ['full-access', 'read-and-write', 'read-only'],
                          description: 'The level of access to the list.',
                        },
                      },
                      required: ['workspace_member_id', 'level'],
                    },
                    description:
                      'The level of access granted to specific workspace members for this list. Pass an empty array to grant access to no workspace members.',
                  },
                },
                required: [
                  'name',
                  'api_slug',
                  'parent_object',
                  'workspace_access',
                  'workspace_member_access',
                ],
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/lists',
      executionParameters: [],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['list_configuration:read-write'] }],
    },
  ],
  [
    'getv2listsbylist',
    {
      name: 'getv2listsbylist',
      description: `Gets a single list in your workspace that your access token has access to.

Required scopes: \`list_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          list: { type: 'string', description: 'A UUID or slug to identify the list.' },
        },
        required: ['list'],
      },
      method: 'get',
      pathTemplate: '/v2/lists/{list}',
      executionParameters: [{ name: 'list', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['list_configuration:read'] }],
    },
  ],
  [
    'patchv2listsbylist',
    {
      name: 'patchv2listsbylist',
      description: `Updates an existing list. Permissions for the list are controlled with the \`workspace_access\` and \`workspace_member_access\` parameters. Please note that lists must have either \`workspace_access\` set to \`"full-access"\` or one or more element of \`workspace_member_access\` with a \`"full-access"\` level. It is also possible to receive a \`403\` billing error if your workspace is not on a plan that supports either advanced workspace or workspace member level access for lists. Changing the parent object of a list is not possible through the API as it can have unintended side-effects that should be considered carefully. If you wish to carry out a parent object change you should do so through the UI.

Required scopes: \`list_configuration:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          list: { type: 'string', description: 'A UUID or slug to identify the list to update.' },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'The human-readable name of the list.' },
                  api_slug: {
                    type: 'string',
                    description:
                      'A unique, human-readable slug to access the list through API calls. Should be formatted in snake case.',
                  },
                  workspace_access: {
                    type: ['string', 'null'],
                    enum: ['full-access', 'read-and-write', 'read-only'],
                    description:
                      'The level of access granted to all members of the workspace for this list. Pass `null` to keep the list private and only grant access to specific workspace members.',
                  },
                  workspace_member_access: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        workspace_member_id: {
                          type: 'string',
                          format: 'uuid',
                          description:
                            'A UUID to identify the workspace member to grant access to.',
                        },
                        level: {
                          type: 'string',
                          enum: ['full-access', 'read-and-write', 'read-only'],
                          description: 'The level of access to the list.',
                        },
                      },
                      required: ['workspace_member_id', 'level'],
                    },
                    description:
                      'The level of access granted to specific workspace members for this list. Pass an empty array to grant access to no workspace members.',
                  },
                },
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['list', 'requestBody'],
      },
      method: 'patch',
      pathTemplate: '/v2/lists/{list}',
      executionParameters: [{ name: 'list', in: 'path' }],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['list_configuration:read-write'] }],
    },
  ],
  [
    'postv2listsentriesquery',
    {
      name: 'postv2listsentriesquery',
      description: `Lists entries in a given list, with the option to filter and sort results.

Required scopes: \`list_entry:read\`, \`list_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          list: {
            type: 'string',
            description: 'A UUID or slug to identify the list to retrieve entries from.',
          },
          requestBody: {
            type: 'object',
            properties: {
              filter: {
                type: 'object',
                description:
                  'An object used to filter results to a subset of results. See the [full guide to filtering and sorting here](/rest-api/how-to/filtering-and-sorting).',
                additionalProperties: true,
              },
              sorts: {
                type: 'array',
                items: {
                  anyOf: [
                    {
                      type: 'object',
                      properties: {
                        direction: {
                          type: 'string',
                          enum: ['asc', 'desc'],
                          description: 'The direction to sort the results by.',
                        },
                        attribute: {
                          type: 'string',
                          description: 'A slug or ID to identify the attribute to sort by.',
                        },
                        field: {
                          type: 'string',
                          description:
                            'Which field on the value to sort by e.g. "last_name" on a name value.',
                        },
                      },
                      required: ['direction', 'attribute'],
                      description: 'Sort by attribute',
                    },
                    {
                      type: 'object',
                      properties: {
                        direction: {
                          type: 'string',
                          enum: ['asc', 'desc'],
                          description: 'The direction to sort the results by.',
                        },
                        path: {
                          type: 'array',
                          items: {
                            type: 'array',
                            items: {
                              anyOf: [
                                {
                                  type: 'string',
                                  description: 'The slug or ID of the object e.g. "people".',
                                },
                                {
                                  type: 'string',
                                  description: 'A slug or ID to identify the attribute to sort by.',
                                },
                              ],
                            },
                            minItems: 2,
                            maxItems: 2,
                          },
                          description:
                            "You may use the `path` property to traverse record reference attributes and parent records on list entries. `path` accepts an array of tuples where the first element of each tuple is the slug or ID of a list/object, and the second element is the slug or ID of an attribute on that list/object. The first element of the first tuple must correspond to the list or object that you are querying. For example, if you wanted to sort by the name of the parent record (a company) on a list with the slug \"sales\", you would pass the value `[['sales', 'parent_record'], ['companies', 'name']]`.",
                        },
                        field: {
                          type: 'string',
                          description:
                            'Which field on the value to sort by e.g. "last_name" on a name value.',
                        },
                      },
                      required: ['direction', 'path'],
                      description: 'Sort by path',
                    },
                  ],
                },
                description:
                  'An object used to sort results. See the [full guide to filtering and sorting here](/rest-api/how-to/filtering-and-sorting).',
              },
              limit: {
                type: 'number',
                description:
                  'The maximum number of results to return. Defaults to 500. See the [full guide to pagination here](/rest-api/how-to/pagination).',
              },
              offset: {
                type: 'number',
                description:
                  'The number of results to skip over before returning. Defaults to 0. See the [full guide to pagination here](/rest-api/how-to/pagination).',
              },
            },
            description: 'The JSON request body.',
          },
        },
        required: ['list', 'requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/lists/{list}/entries/query',
      executionParameters: [{ name: 'list', in: 'path' }],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['list_entry:read', 'list_configuration:read'] }],
    },
  ],
  [
    'putv2listsentries',
    {
      name: 'putv2listsentries',
      description: `Use this endpoint to create or update a list entry for a given parent record. If an entry with the specified parent record is found, that entry will be updated. If no such entry is found, a new entry will be created instead. If there are multiple entries with the same parent record, this endpoint with return the "MULTIPLE_MATCH_RESULTS" error. When writing to multi-select attributes, all values will be either created or deleted as necessary to match the list of values supplied in the request body.

Required scopes: \`list_entry:read-write\`, \`list_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          list: {
            type: 'string',
            description: 'A UUID or slug of the list the list entry belongs to.',
          },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  parent_record_id: {
                    type: 'string',
                    format: 'uuid',
                    description:
                      "A UUID identifying the record you want to add to the list. The record will become the 'parent' of the created list entry.",
                  },
                  parent_object: {
                    type: 'string',
                    description:
                      'A UUID or slug identifying the object that the added parent record belongs to.',
                  },
                  entry_values: {
                    type: 'object',
                    description:
                      'An object with an attribute `api_slug` or `attribute_id` as the key, and a single value (for single-select attributes), or an array of values (for single or multi-select attributes) as the values. For complete documentation on values for all attribute types, please see our [attribute type docs](/docs/attribute-types).',
                    additionalProperties: { type: 'array' },
                  },
                },
                required: ['parent_record_id', 'parent_object', 'entry_values'],
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['list', 'requestBody'],
      },
      method: 'put',
      pathTemplate: '/v2/lists/{list}/entries',
      executionParameters: [{ name: 'list', in: 'path' }],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['list_entry:read-write', 'list_configuration:read'] }],
    },
  ],
  [
    'postv2listsentries',
    {
      name: 'postv2listsentries',
      description: `Adds a record to a list as a new list entry. This endpoint will throw on conflicts of unique attributes. Multiple list entries are allowed for the same parent record

Required scopes: \`list_entry:read-write\`, \`list_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          list: {
            type: 'string',
            description:
              'The UUID or slug identifying the list that the created list entry should belong to.',
          },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  parent_record_id: {
                    type: 'string',
                    format: 'uuid',
                    description:
                      "A UUID identifying the record you want to add to the list. The record will become the 'parent' of the created list entry.",
                  },
                  parent_object: {
                    type: 'string',
                    description:
                      'A UUID or slug identifying the object that the added parent record belongs to.',
                  },
                  entry_values: {
                    type: 'object',
                    description:
                      'An object with an attribute `api_slug` or `attribute_id` as the key, and a single value (for single-select attributes), or an array of values (for single or multi-select attributes) as the values. For complete documentation on values for all attribute types, please see our [attribute type docs](/docs/attribute-types).',
                    additionalProperties: { type: 'array' },
                  },
                },
                required: ['parent_record_id', 'parent_object', 'entry_values'],
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['list', 'requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/lists/{list}/entries',
      executionParameters: [{ name: 'list', in: 'path' }],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['list_entry:read-write', 'list_configuration:read'] }],
    },
  ],
  [
    'getv2listsentriesbyentryid',
    {
      name: 'getv2listsentriesbyentryid',
      description: `Gets a single list entry by its \`entry_id\`.

Required scopes: \`list_entry:read\`, \`list_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          list: {
            type: 'string',
            description: 'A UUID or slug identifying the list the entry is in.',
          },
          entry_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID identifying the entry.',
          },
        },
        required: ['list', 'entry_id'],
      },
      method: 'get',
      pathTemplate: '/v2/lists/{list}/entries/{entry_id}',
      executionParameters: [
        { name: 'list', in: 'path' },
        { name: 'entry_id', in: 'path' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['list_entry:read', 'list_configuration:read'] }],
    },
  ],
  [
    'putv2listsentriesbyentryid',
    {
      name: 'putv2listsentriesbyentryid',
      description: `Use this endpoint to update list entries by \`entry_id\`. If the update payload includes multiselect attributes, the values supplied will overwrite/remove the list of values that already exist (if any). Use the \`PATCH\` endpoint to add multiselect attribute values without removing those value that already exist.

Required scopes: \`list_entry:read-write\`, \`list_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          list: {
            type: 'string',
            description: 'A UUID or slug of the list the list entry belongs to.',
          },
          entry_id: { type: 'string', description: 'A UUID of the list entry to update.' },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  entry_values: {
                    type: 'object',
                    description:
                      'An object with an attribute `api_slug` or `attribute_id` as the key, and a single value (for single-select attributes), or an array of values (for single or multi-select attributes) as the values. For complete documentation on values for all attribute types, please see our [attribute type docs](/docs/attribute-types).',
                    additionalProperties: { type: 'array' },
                  },
                },
                required: ['entry_values'],
                additionalProperties: false,
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['list', 'entry_id', 'requestBody'],
      },
      method: 'put',
      pathTemplate: '/v2/lists/{list}/entries/{entry_id}',
      executionParameters: [
        { name: 'list', in: 'path' },
        { name: 'entry_id', in: 'path' },
      ],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['list_entry:read-write', 'list_configuration:read'] }],
    },
  ],
  [
    'deletev2listsentriesbyentryid',
    {
      name: 'deletev2listsentriesbyentryid',
      description: `Deletes a single list entry by its \`entry_id\`.

Required scopes: \`list_entry:read-write\`, \`list_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          list: {
            type: 'string',
            description: 'A UUID or slug identifying the list the entry is in.',
          },
          entry_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID identifying the entry to delete.',
          },
        },
        required: ['list', 'entry_id'],
      },
      method: 'delete',
      pathTemplate: '/v2/lists/{list}/entries/{entry_id}',
      executionParameters: [
        { name: 'list', in: 'path' },
        { name: 'entry_id', in: 'path' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['list_entry:read-write', 'list_configuration:read'] }],
    },
  ],
  [
    'patchv2listsentriesbyentryid',
    {
      name: 'patchv2listsentriesbyentryid',
      description: `Use this endpoint to update list entries by \`entry_id\`. If the update payload includes multiselect attributes, the values supplied will be created and prepended to the list of values that already exist (if any). Use the \`PUT\` endpoint to overwrite or remove multiselect attribute values.

Required scopes: \`list_entry:read-write\`, \`list_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          list: {
            type: 'string',
            description: 'A UUID or slug of the list the list entry belongs to.',
          },
          entry_id: { type: 'string', description: 'A UUID of the list entry to update.' },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  entry_values: {
                    type: 'object',
                    description:
                      'An object with an attribute `api_slug` or `attribute_id` as the key, and a single value (for single-select attributes), or an array of values (for single or multi-select attributes) as the values. For complete documentation on values for all attribute types, please see our [attribute type docs](/docs/attribute-types).',
                    additionalProperties: { type: 'array' },
                  },
                },
                required: ['entry_values'],
                additionalProperties: false,
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['list', 'entry_id', 'requestBody'],
      },
      method: 'patch',
      pathTemplate: '/v2/lists/{list}/entries/{entry_id}',
      executionParameters: [
        { name: 'list', in: 'path' },
        { name: 'entry_id', in: 'path' },
      ],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['list_entry:read-write', 'list_configuration:read'] }],
    },
  ],
  [
    'getv2listsentriesattributesvalues',
    {
      name: 'getv2listsentriesattributesvalues',
      description: `Gets all values for a given attribute on a list entry. If the attribute is historic, this endpoint has the ability to return all historic values using the \`show_historic\` query param.

Required scopes: \`list_entry:read\`, \`list_configuration:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          list: {
            type: 'string',
            description: 'A UUID or slug identifying the list the entry is in.',
          },
          entry_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID identifying the entry.',
          },
          attribute: {
            type: 'string',
            description: 'A UUID or slug to identify the attribute you want to query values on.',
          },
          show_historic: {
            type: 'boolean',
            description:
              'If `true`, the endpoint will return all historic values for the attribute. If `false`, the endpoint will only return the currently active value(s). Defaults to `false`. Can only be set to `true` for attributes which support historic data; the endpoint will throw if set to `true` for non-historic attributes.',
            default: false,
          },
          limit: {
            type: 'number',
            description:
              'The maximum number of results to return. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
          offset: {
            type: 'number',
            description:
              'The number of results to skip over before returning. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
        },
        required: ['list', 'entry_id', 'attribute'],
      },
      method: 'get',
      pathTemplate: '/v2/lists/{list}/entries/{entry_id}/attributes/{attribute}/values',
      executionParameters: [
        { name: 'list', in: 'path' },
        { name: 'entry_id', in: 'path' },
        { name: 'attribute', in: 'path' },
        { name: 'show_historic', in: 'query' },
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['list_entry:read', 'list_configuration:read'] }],
    },
  ],
  [
    'getv2workspacemembers',
    {
      name: 'getv2workspacemembers',
      description: `Lists all workspace members in the workspace.

Required scopes: \`user_management:read\`.`,
      inputSchema: { type: 'object', properties: {} },
      method: 'get',
      pathTemplate: '/v2/workspace_members',
      executionParameters: [],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['user_management:read'] }],
    },
  ],
  [
    'getv2workspacemembersbyworkspacememberid',
    {
      name: 'getv2workspacemembersbyworkspacememberid',
      description: `Gets a single workspace member by ID.

Required scopes: \`user_management:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          workspace_member_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID to identify the workspace member.',
          },
        },
        required: ['workspace_member_id'],
      },
      method: 'get',
      pathTemplate: '/v2/workspace_members/{workspace_member_id}',
      executionParameters: [{ name: 'workspace_member_id', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['user_management:read'] }],
    },
  ],
  [
    'getv2notes',
    {
      name: 'getv2notes',
      description: `List notes for all records or for a specific record.

Required scopes: \`note:read\`, \`object_configuration:read\`, \`record_permission:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description:
              'The maximum number of results to return. The default is `10` and the maximum is `50`. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
          offset: {
            type: 'number',
            description:
              'The number of results to skip over before returning. The default is `0`. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
          parent_object: {
            type: 'string',
            description: 'The slug or ID of the parent object the notes belong to.',
          },
          parent_record_id: {
            type: 'string',
            format: 'uuid',
            description: 'The ID of the parent record the notes belong to.',
          },
        },
      },
      method: 'get',
      pathTemplate: '/v2/notes',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'parent_object', in: 'query' },
        { name: 'parent_record_id', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [
        { oauth2: ['note:read', 'object_configuration:read', 'record_permission:read'] },
      ],
    },
  ],
  [
    'postv2notes',
    {
      name: 'postv2notes',
      description: `Creates a new note for a given record.

Required scopes: \`note:read-write\`, \`object_configuration:read\`, \`record_permission:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  parent_object: {
                    type: 'string',
                    description: 'The ID or slug of the parent object the note belongs to.',
                  },
                  parent_record_id: {
                    type: 'string',
                    format: 'uuid',
                    description: 'The ID of the parent record the note belongs to.',
                  },
                  title: {
                    type: 'string',
                    description:
                      'The note title. The title is plaintext only and has no formatting.',
                  },
                  format: {
                    type: 'string',
                    enum: ['plaintext', 'markdown'],
                    description:
                      "Specify the format for the note's content. Choose from:\n- `plaintext`: Standard text format where `\\n` signifies a new line.\n- `markdown`: Enables rich text formatting using a subset of Markdown syntax:\n  - **Headings**: Levels 1-3 (`#`, `##`, `###`).\n  - **Lists**: Unordered (`-`, `*`, `+`) and ordered (`1.`, `2.`).\n  - **Text styles**: Bold (`**bold**` or `__bold__`), italic (`*italic*` or `_italic_`), strikethrough (`~~strikethrough~~`), and highlight (`==highlighted==`).\n  - **Links**: Standard Markdown links (`[link text](https://example.com)`).\n\n  *Note: While the Attio interface supports image embeds, they cannot currently be added or retrieved via the API's markdown format.*",
                  },
                  content: {
                    type: 'string',
                    description:
                      'The main content of the note, formatted according to the value provided in the `format` field. Use `\\n` for line breaks in `plaintext`. For `markdown`, utilize the supported syntax elements to structure and style your note.',
                  },
                  created_at: {
                    type: 'string',
                    description:
                      '`created_at` will default to the current time. However, if you wish to backdate a note for migration or other purposes, you can override with a custom `created_at` value. Note that dates before 1970 or in the future are not allowed.',
                  },
                },
                required: ['parent_object', 'parent_record_id', 'title', 'format', 'content'],
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/notes',
      executionParameters: [],
      requestBodyContentType: 'application/json',
      securityRequirements: [
        { oauth2: ['note:read-write', 'object_configuration:read', 'record_permission:read'] },
      ],
    },
  ],
  [
    'getv2notesbynoteid',
    {
      name: 'getv2notesbynoteid',
      description: `Get a single note by ID.

Required scopes: \`note:read\`, \`object_configuration:read\`, \`record_permission:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          note_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID which identifies the note.',
          },
        },
        required: ['note_id'],
      },
      method: 'get',
      pathTemplate: '/v2/notes/{note_id}',
      executionParameters: [{ name: 'note_id', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [
        { oauth2: ['note:read', 'object_configuration:read', 'record_permission:read'] },
      ],
    },
  ],
  [
    'deletev2notesbynoteid',
    {
      name: 'deletev2notesbynoteid',
      description: `Delete a single note by ID.

Required scopes: \`note:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          note_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID which identifies the note to delete.',
          },
        },
        required: ['note_id'],
      },
      method: 'delete',
      pathTemplate: '/v2/notes/{note_id}',
      executionParameters: [{ name: 'note_id', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['note:read-write'] }],
    },
  ],
  [
    'getv2tasks',
    {
      name: 'getv2tasks',
      description: `List all tasks. Results are sorted by creation date, from oldest to newest.

Required scopes: \`task:read\`, \`object_configuration:read\`, \`record_permission:read\`, \`user_management:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description:
              'The maximum number of results to return. Defaults to 500. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
          offset: {
            type: 'number',
            description:
              'The number of results to skip over before returning. Defaults to 0. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
          sort: {
            type: 'string',
            enum: ['created_at:asc', 'created_at:desc'],
            description:
              'Optionally sort the results. "created_at:asc" returns oldest results first, "created_at:desc" returns the newest results first. If unspecified, defaults to "created_at:asc" (oldest results first).',
          },
          linked_object: {
            type: 'string',
            description:
              'Pass a value to this parameter to filter results to only those tasks that contain the specified record in the `linked_records` property of the task. This parameter should identify the object that the linked record belongs to. For example, if filtering to tasks that link to a specific person record, this parameter should be `people`. If provided, `linked_record_id` must also be provided.',
          },
          linked_record_id: {
            type: 'string',
            format: 'uuid',
            description:
              'Pass a value to this parameter to filter results to only those tasks that contain the specified record in the `linked_records` property of the task. This parameter should contain the record ID of the linked record. If provided, `linked_object` must also be provided.',
          },
          assignee: {
            type: ['string', 'null'],
            description:
              'Filter tasks by workspace member assignees. Workspace members can be referenced by either their email address or ID. Pass an empty value or the string `null` to find tasks with no assignee.',
            examples: ['50cf242c-7fa3-4cad-87d0-75b1af71c57b', 'alice@attio.com'],
          },
          is_completed: {
            type: 'boolean',
            description:
              'Filter tasks by whether they have been completed. By default, both completed and non-completed tasks are returned. Specify `true` to only return completed tasks, or `false` to only return non-completed tasks.',
          },
        },
      },
      method: 'get',
      pathTemplate: '/v2/tasks',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'sort', in: 'query' },
        { name: 'linked_object', in: 'query' },
        { name: 'linked_record_id', in: 'query' },
        { name: 'assignee', in: 'query' },
        { name: 'is_completed', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [
        {
          oauth2: [
            'task:read',
            'object_configuration:read',
            'record_permission:read',
            'user_management:read',
          ],
        },
      ],
    },
  ],
  [
    'postv2tasks',
    {
      name: 'postv2tasks',
      description: `Creates a new task.

At present, tasks can only be created from plaintext without record reference formatting.

Required scopes: \`task:read-write\`, \`object_configuration:read\`, \`record_permission:read\`, \`user_management:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  content: {
                    type: 'string',
                    description:
                      'The text content of the task, in the format specified by the `format` property.',
                  },
                  format: {
                    type: 'string',
                    enum: ['plaintext'],
                    description:
                      'The format of the task content to be created. Rich text formatting, links and @references are not supported.',
                  },
                  deadline_at: {
                    type: ['string', 'null'],
                    description: 'The deadline of the task, in ISO 8601 format.',
                  },
                  is_completed: {
                    type: 'boolean',
                    description: 'Whether the task has been completed.',
                  },
                  linked_records: {
                    type: 'array',
                    items: {
                      anyOf: [
                        {
                          type: 'object',
                          properties: {
                            target_object: {
                              type: 'string',
                              description:
                                'The ID or slug of the parent object the tasks refers to. This can reference both standard and custom objects.`',
                              example: 'people',
                            },
                            target_record_id: {
                              type: 'string',
                              format: 'uuid',
                              description: 'The ID of the parent record the task refers to.',
                              example: '891dcbfc-9141-415d-9b2a-2238a6cc012d',
                            },
                          },
                          required: ['target_object', 'target_record_id'],
                        },
                        {
                          type: 'object',
                          example: {
                            target_object: 'people',
                            matching_attribute_id_123: [{ value: 'matching_attribute_id_123' }],
                          },
                          properties: {
                            target_object: {
                              type: 'string',
                              example: 'people',
                              description:
                                'A UUID or slug to identify the object that the referenced record belongs to.',
                            },
                            '[slug_or_id_of_matching_attribute]': {
                              type: 'array',
                              description:
                                'In addition to referencing records directly by record ID, you may also reference by a matching attribute of your choice. For example, if you want to add a reference to the person record with email "alice@website.com", you should pass a value with `target_object` set to `"people"` and `email_addresses` set to `[{email_address:"alice@website.com"}]`. The key should be the slug or ID of the matching attribute you would like to use and the value should be an array containing a single value of the appropriate attribute type (as specified below). Matching on multiple values is not currently supported. Matching attributes must be unique. This process is similar to how you use the `matching_attribute` query param in Attio\'s [assert endpoints](/rest-api/endpoint-reference/records/assert-a-record).',
                              items: {
                                anyOf: [
                                  {
                                    type: 'object',
                                    properties: {
                                      domain: {
                                        type: 'string',
                                        example: 'app.attio.com',
                                        description: 'The full domain of the website.',
                                      },
                                    },
                                  },
                                  {
                                    type: 'object',
                                    properties: {
                                      email_address: {
                                        type: 'string',
                                        example: 'alice@app.attio.com',
                                        description: 'An email address string',
                                      },
                                    },
                                  },
                                  {
                                    type: 'object',
                                    properties: {
                                      value: {
                                        type: 'number',
                                        example: 17224912,
                                        description: 'Numbers are persisted as 64 bit floats.',
                                      },
                                    },
                                  },
                                  {
                                    type: 'object',
                                    properties: {
                                      original_phone_number: {
                                        type: 'string',
                                        example: '07234172834',
                                        description: 'The raw, original phone number, as inputted.',
                                      },
                                      country_code: {
                                        type: ['string', 'null'],
                                        enum: [
                                          'AF',
                                          'AX',
                                          'AL',
                                          'DZ',
                                          'AS',
                                          'AD',
                                          'AO',
                                          'AI',
                                          'AQ',
                                          'AG',
                                          'AR',
                                          'AM',
                                          'AW',
                                          'AU',
                                          'AT',
                                          'AZ',
                                          'BS',
                                          'BH',
                                          'BD',
                                          'BB',
                                          'BY',
                                          'BE',
                                          'BZ',
                                          'BJ',
                                          'BM',
                                          'BT',
                                          'BO',
                                          'BA',
                                          'BW',
                                          'BV',
                                          'BR',
                                          'IO',
                                          'BN',
                                          'BG',
                                          'BF',
                                          'BI',
                                          'KH',
                                          'CM',
                                          'CA',
                                          'CV',
                                          'KY',
                                          'CF',
                                          'TD',
                                          'CL',
                                          'CN',
                                          'CX',
                                          'CC',
                                          'CO',
                                          'KM',
                                          'CG',
                                          'CD',
                                          'CK',
                                          'CR',
                                          'CI',
                                          'HR',
                                          'CU',
                                          'CW',
                                          'CY',
                                          'CZ',
                                          'DK',
                                          'DJ',
                                          'DM',
                                          'DO',
                                          'EC',
                                          'EG',
                                          'SV',
                                          'GQ',
                                          'ER',
                                          'EE',
                                          'ET',
                                          'FK',
                                          'FO',
                                          'FJ',
                                          'FI',
                                          'FR',
                                          'GF',
                                          'PF',
                                          'TF',
                                          'GA',
                                          'GM',
                                          'GE',
                                          'DE',
                                          'GH',
                                          'GI',
                                          'GR',
                                          'GL',
                                          'GD',
                                          'GP',
                                          'GU',
                                          'GT',
                                          'GG',
                                          'GN',
                                          'GW',
                                          'GY',
                                          'HT',
                                          'HM',
                                          'VA',
                                          'HN',
                                          'HK',
                                          'HU',
                                          'IS',
                                          'IN',
                                          'ID',
                                          'IR',
                                          'IQ',
                                          'IE',
                                          'IM',
                                          'IL',
                                          'IT',
                                          'JM',
                                          'JP',
                                          'JE',
                                          'JO',
                                          'KZ',
                                          'KE',
                                          'KI',
                                          'KR',
                                          'KW',
                                          'KG',
                                          'LA',
                                          'LV',
                                          'LB',
                                          'LS',
                                          'LR',
                                          'LY',
                                          'LI',
                                          'LT',
                                          'LU',
                                          'MO',
                                          'MK',
                                          'MG',
                                          'MW',
                                          'MY',
                                          'MV',
                                          'ML',
                                          'MT',
                                          'MH',
                                          'MQ',
                                          'MR',
                                          'MU',
                                          'YT',
                                          'MX',
                                          'FM',
                                          'MD',
                                          'MC',
                                          'MN',
                                          'ME',
                                          'MS',
                                          'MA',
                                          'MZ',
                                          'MM',
                                          'NA',
                                          'NR',
                                          'NP',
                                          'NL',
                                          'AN',
                                          'NC',
                                          'NZ',
                                          'NI',
                                          'NE',
                                          'NG',
                                          'NU',
                                          'NF',
                                          'MP',
                                          'NO',
                                          'OM',
                                          'PK',
                                          'PW',
                                          'PS',
                                          'PA',
                                          'PG',
                                          'PY',
                                          'PE',
                                          'PH',
                                          'PN',
                                          'PL',
                                          'PT',
                                          'PR',
                                          'QA',
                                          'RE',
                                          'RO',
                                          'RU',
                                          'RW',
                                          'BL',
                                          'SH',
                                          'KN',
                                          'LC',
                                          'MF',
                                          'PM',
                                          'VC',
                                          'WS',
                                          'SM',
                                          'ST',
                                          'SA',
                                          'SN',
                                          'SS',
                                          'RS',
                                          'SC',
                                          'SL',
                                          'SG',
                                          'SK',
                                          'SI',
                                          'SB',
                                          'SO',
                                          'ZA',
                                          'GS',
                                          'ES',
                                          'LK',
                                          'SD',
                                          'SR',
                                          'SJ',
                                          'SZ',
                                          'SE',
                                          'CH',
                                          'SY',
                                          'TW',
                                          'TJ',
                                          'TZ',
                                          'TH',
                                          'TL',
                                          'TG',
                                          'TK',
                                          'TO',
                                          'TT',
                                          'TN',
                                          'TR',
                                          'TM',
                                          'TC',
                                          'TV',
                                          'UG',
                                          'UA',
                                          'AE',
                                          'GB',
                                          'US',
                                          'UM',
                                          'UY',
                                          'UZ',
                                          'VU',
                                          'VE',
                                          'VN',
                                          'VG',
                                          'VI',
                                          'WF',
                                          'EH',
                                          'YE',
                                          'ZM',
                                          'ZW',
                                          'BQ',
                                          'KP',
                                          'SX',
                                        ],
                                        example: 'GB',
                                        description:
                                          'The ISO 3166-1 alpha-2 country code representing the country that this phone number belongs to.',
                                      },
                                    },
                                  },
                                  {
                                    type: 'object',
                                    properties: {
                                      value: {
                                        type: 'string',
                                        description:
                                          'A raw text field. Values are limited to 10MB.',
                                      },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                          required: ['target_object', '[slug_or_id_of_matching_attribute]'],
                        },
                      ],
                    },
                    description:
                      'Records linked to the task. Creating record links within task content text is not possible via the API at present.',
                  },
                  assignees: {
                    type: 'array',
                    items: {
                      anyOf: [
                        {
                          type: 'object',
                          properties: {
                            referenced_actor_type: {
                              type: 'string',
                              enum: ['workspace-member'],
                              description:
                                'The actor type of the task assignee. Only `workspace-member` actors can be assigned to tasks. [Read more information on actor types here](/docs/actors).',
                              example: 'workspace-member',
                            },
                            referenced_actor_id: {
                              type: 'string',
                              format: 'uuid',
                              description: 'The ID of the actor assigned to this task.',
                              example: '50cf242c-7fa3-4cad-87d0-75b1af71c57b',
                            },
                          },
                          required: ['referenced_actor_type', 'referenced_actor_id'],
                        },
                        {
                          type: 'object',
                          properties: {
                            workspace_member_email_address: {
                              type: 'string',
                              description:
                                'Workspace member actors can be referenced by email address as well as actor ID.',
                              example: 'alice@attio.com',
                            },
                          },
                          required: ['workspace_member_email_address'],
                          additionalProperties: false,
                        },
                      ],
                    },
                    description: 'Workspace members assigned to this task.',
                  },
                },
                required: [
                  'content',
                  'format',
                  'deadline_at',
                  'is_completed',
                  'linked_records',
                  'assignees',
                ],
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/tasks',
      executionParameters: [],
      requestBodyContentType: 'application/json',
      securityRequirements: [
        {
          oauth2: [
            'task:read-write',
            'object_configuration:read',
            'record_permission:read',
            'user_management:read',
          ],
        },
      ],
    },
  ],
  [
    'getv2tasksbytaskid',
    {
      name: 'getv2tasksbytaskid',
      description: `Get a single task by ID.

Required scopes: \`task:read\`, \`object_configuration:read\`, \`record_permission:read\`, \`user_management:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          task_id: { type: 'string', format: 'uuid', description: 'The ID of the task.' },
        },
        required: ['task_id'],
      },
      method: 'get',
      pathTemplate: '/v2/tasks/{task_id}',
      executionParameters: [{ name: 'task_id', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [
        {
          oauth2: [
            'task:read',
            'object_configuration:read',
            'record_permission:read',
            'user_management:read',
          ],
        },
      ],
    },
  ],
  [
    'deletev2tasksbytaskid',
    {
      name: 'deletev2tasksbytaskid',
      description: `Delete a task by ID.

Required scopes: \`task:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          task_id: { type: 'string', format: 'uuid', description: 'The ID of the task to delete.' },
        },
        required: ['task_id'],
      },
      method: 'delete',
      pathTemplate: '/v2/tasks/{task_id}',
      executionParameters: [{ name: 'task_id', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['task:read-write'] }],
    },
  ],
  [
    'patchv2tasksbytaskid',
    {
      name: 'patchv2tasksbytaskid',
      description: `Updates an existing task by \`task_id\`. At present, only the \`deadline_at\`, \`is_completed\`, \`linked_records\`, and \`assignees\` fields can be updated.

Required scopes: \`task:read-write\`, \`object_configuration:read\`, \`record_permission:read\`, \`user_management:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          task_id: { type: 'string', format: 'uuid', description: 'The ID of the task to update.' },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  deadline_at: {
                    type: ['string', 'null'],
                    description: 'The deadline of the task, in ISO 8601 format.',
                  },
                  is_completed: {
                    type: 'boolean',
                    description: 'Whether the task has been completed.',
                  },
                  linked_records: {
                    type: 'array',
                    items: {
                      anyOf: [
                        {
                          type: 'object',
                          properties: {
                            target_object: {
                              type: 'string',
                              description:
                                'The ID or slug of the parent object the tasks refers to. This can reference both standard and custom objects.`',
                              example: 'people',
                            },
                            target_record_id: {
                              type: 'string',
                              format: 'uuid',
                              description: 'The ID of the parent record the task refers to.',
                              example: '891dcbfc-9141-415d-9b2a-2238a6cc012d',
                            },
                          },
                          required: ['target_object', 'target_record_id'],
                        },
                        {
                          type: 'object',
                          example: {
                            target_object: 'people',
                            matching_attribute_id_123: [{ value: 'matching_attribute_id_123' }],
                          },
                          properties: {
                            target_object: {
                              type: 'string',
                              example: 'people',
                              description:
                                'A UUID or slug to identify the object that the referenced record belongs to.',
                            },
                            '[slug_or_id_of_matching_attribute]': {
                              type: 'array',
                              description:
                                'In addition to referencing records directly by record ID, you may also reference by a matching attribute of your choice. For example, if you want to add a reference to the person record with email "alice@website.com", you should pass a value with `target_object` set to `"people"` and `email_addresses` set to `[{email_address:"alice@website.com"}]`. The key should be the slug or ID of the matching attribute you would like to use and the value should be an array containing a single value of the appropriate attribute type (as specified below). Matching on multiple values is not currently supported. Matching attributes must be unique. This process is similar to how you use the `matching_attribute` query param in Attio\'s [assert endpoints](/rest-api/endpoint-reference/records/assert-a-record).',
                              items: {
                                anyOf: [
                                  {
                                    type: 'object',
                                    properties: {
                                      domain: {
                                        type: 'string',
                                        example: 'app.attio.com',
                                        description: 'The full domain of the website.',
                                      },
                                    },
                                  },
                                  {
                                    type: 'object',
                                    properties: {
                                      email_address: {
                                        type: 'string',
                                        example: 'alice@app.attio.com',
                                        description: 'An email address string',
                                      },
                                    },
                                  },
                                  {
                                    type: 'object',
                                    properties: {
                                      value: {
                                        type: 'number',
                                        example: 17224912,
                                        description: 'Numbers are persisted as 64 bit floats.',
                                      },
                                    },
                                  },
                                  {
                                    type: 'object',
                                    properties: {
                                      original_phone_number: {
                                        type: 'string',
                                        example: '07234172834',
                                        description: 'The raw, original phone number, as inputted.',
                                      },
                                      country_code: {
                                        type: ['string', 'null'],
                                        enum: [
                                          'AF',
                                          'AX',
                                          'AL',
                                          'DZ',
                                          'AS',
                                          'AD',
                                          'AO',
                                          'AI',
                                          'AQ',
                                          'AG',
                                          'AR',
                                          'AM',
                                          'AW',
                                          'AU',
                                          'AT',
                                          'AZ',
                                          'BS',
                                          'BH',
                                          'BD',
                                          'BB',
                                          'BY',
                                          'BE',
                                          'BZ',
                                          'BJ',
                                          'BM',
                                          'BT',
                                          'BO',
                                          'BA',
                                          'BW',
                                          'BV',
                                          'BR',
                                          'IO',
                                          'BN',
                                          'BG',
                                          'BF',
                                          'BI',
                                          'KH',
                                          'CM',
                                          'CA',
                                          'CV',
                                          'KY',
                                          'CF',
                                          'TD',
                                          'CL',
                                          'CN',
                                          'CX',
                                          'CC',
                                          'CO',
                                          'KM',
                                          'CG',
                                          'CD',
                                          'CK',
                                          'CR',
                                          'CI',
                                          'HR',
                                          'CU',
                                          'CW',
                                          'CY',
                                          'CZ',
                                          'DK',
                                          'DJ',
                                          'DM',
                                          'DO',
                                          'EC',
                                          'EG',
                                          'SV',
                                          'GQ',
                                          'ER',
                                          'EE',
                                          'ET',
                                          'FK',
                                          'FO',
                                          'FJ',
                                          'FI',
                                          'FR',
                                          'GF',
                                          'PF',
                                          'TF',
                                          'GA',
                                          'GM',
                                          'GE',
                                          'DE',
                                          'GH',
                                          'GI',
                                          'GR',
                                          'GL',
                                          'GD',
                                          'GP',
                                          'GU',
                                          'GT',
                                          'GG',
                                          'GN',
                                          'GW',
                                          'GY',
                                          'HT',
                                          'HM',
                                          'VA',
                                          'HN',
                                          'HK',
                                          'HU',
                                          'IS',
                                          'IN',
                                          'ID',
                                          'IR',
                                          'IQ',
                                          'IE',
                                          'IM',
                                          'IL',
                                          'IT',
                                          'JM',
                                          'JP',
                                          'JE',
                                          'JO',
                                          'KZ',
                                          'KE',
                                          'KI',
                                          'KR',
                                          'KW',
                                          'KG',
                                          'LA',
                                          'LV',
                                          'LB',
                                          'LS',
                                          'LR',
                                          'LY',
                                          'LI',
                                          'LT',
                                          'LU',
                                          'MO',
                                          'MK',
                                          'MG',
                                          'MW',
                                          'MY',
                                          'MV',
                                          'ML',
                                          'MT',
                                          'MH',
                                          'MQ',
                                          'MR',
                                          'MU',
                                          'YT',
                                          'MX',
                                          'FM',
                                          'MD',
                                          'MC',
                                          'MN',
                                          'ME',
                                          'MS',
                                          'MA',
                                          'MZ',
                                          'MM',
                                          'NA',
                                          'NR',
                                          'NP',
                                          'NL',
                                          'AN',
                                          'NC',
                                          'NZ',
                                          'NI',
                                          'NE',
                                          'NG',
                                          'NU',
                                          'NF',
                                          'MP',
                                          'NO',
                                          'OM',
                                          'PK',
                                          'PW',
                                          'PS',
                                          'PA',
                                          'PG',
                                          'PY',
                                          'PE',
                                          'PH',
                                          'PN',
                                          'PL',
                                          'PT',
                                          'PR',
                                          'QA',
                                          'RE',
                                          'RO',
                                          'RU',
                                          'RW',
                                          'BL',
                                          'SH',
                                          'KN',
                                          'LC',
                                          'MF',
                                          'PM',
                                          'VC',
                                          'WS',
                                          'SM',
                                          'ST',
                                          'SA',
                                          'SN',
                                          'SS',
                                          'RS',
                                          'SC',
                                          'SL',
                                          'SG',
                                          'SK',
                                          'SI',
                                          'SB',
                                          'SO',
                                          'ZA',
                                          'GS',
                                          'ES',
                                          'LK',
                                          'SD',
                                          'SR',
                                          'SJ',
                                          'SZ',
                                          'SE',
                                          'CH',
                                          'SY',
                                          'TW',
                                          'TJ',
                                          'TZ',
                                          'TH',
                                          'TL',
                                          'TG',
                                          'TK',
                                          'TO',
                                          'TT',
                                          'TN',
                                          'TR',
                                          'TM',
                                          'TC',
                                          'TV',
                                          'UG',
                                          'UA',
                                          'AE',
                                          'GB',
                                          'US',
                                          'UM',
                                          'UY',
                                          'UZ',
                                          'VU',
                                          'VE',
                                          'VN',
                                          'VG',
                                          'VI',
                                          'WF',
                                          'EH',
                                          'YE',
                                          'ZM',
                                          'ZW',
                                          'BQ',
                                          'KP',
                                          'SX',
                                        ],
                                        example: 'GB',
                                        description:
                                          'The ISO 3166-1 alpha-2 country code representing the country that this phone number belongs to.',
                                      },
                                    },
                                  },
                                  {
                                    type: 'object',
                                    properties: {
                                      value: {
                                        type: 'string',
                                        description:
                                          'A raw text field. Values are limited to 10MB.',
                                      },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                          required: ['target_object', '[slug_or_id_of_matching_attribute]'],
                        },
                      ],
                    },
                    description:
                      'Records linked to the task. Creating record links within task content text is not possible via the API at present.',
                  },
                  assignees: {
                    type: 'array',
                    items: {
                      anyOf: [
                        {
                          type: 'object',
                          properties: {
                            referenced_actor_type: {
                              type: 'string',
                              enum: ['workspace-member'],
                              description:
                                'The actor type of the task assignee. Only `workspace-member` actors can be assigned to tasks. [Read more information on actor types here](/docs/actors).',
                              example: 'workspace-member',
                            },
                            referenced_actor_id: {
                              type: 'string',
                              format: 'uuid',
                              description: 'The ID of the actor assigned to this task.',
                              example: '50cf242c-7fa3-4cad-87d0-75b1af71c57b',
                            },
                          },
                          required: ['referenced_actor_type', 'referenced_actor_id'],
                        },
                        {
                          type: 'object',
                          properties: {
                            workspace_member_email_address: {
                              type: 'string',
                              description:
                                'Workspace member actors can be referenced by email address as well as actor ID.',
                              example: 'alice@attio.com',
                            },
                          },
                          required: ['workspace_member_email_address'],
                          additionalProperties: false,
                        },
                      ],
                    },
                    description: 'Workspace members assigned to this task.',
                  },
                },
                additionalProperties: false,
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['task_id', 'requestBody'],
      },
      method: 'patch',
      pathTemplate: '/v2/tasks/{task_id}',
      executionParameters: [{ name: 'task_id', in: 'path' }],
      requestBodyContentType: 'application/json',
      securityRequirements: [
        {
          oauth2: [
            'task:read-write',
            'object_configuration:read',
            'record_permission:read',
            'user_management:read',
          ],
        },
      ],
    },
  ],
  [
    'getv2threads',
    {
      name: 'getv2threads',
      description: `List threads of comments on a record or list entry.

To view threads on records, you will need the \`object_configuration:read\` and \`record_permission:read\` scopes.

To view threads on list entries, you will need the \`list_configuration:read\` and \`list_entry:read\` scopes.

Required scopes: \`comment:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          record_id: {
            type: 'string',
            format: 'uuid',
            description:
              'Use this parameter to filter to threads on a specific record. Must be passed with `object`.',
          },
          object: {
            type: 'string',
            description:
              'Use this parameter to filter to threads on a specific record. Must be passed with `record_id`. Accepts either a slug or an ID.',
          },
          entry_id: {
            type: 'string',
            format: 'uuid',
            description:
              'Use this parameter to filter to threads on a specific entry. Must be passed with `list`.',
          },
          list: {
            type: 'string',
            description:
              'Use this parameter to filter to threads on a specific entry. Must be passed with `entry_id`. Accepts either a slug or an ID.',
          },
          limit: {
            type: 'number',
            description:
              'The maximum number of results to return. The default is `10` and the maximum is `50`. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
          offset: {
            type: 'number',
            description:
              'The number of results to skip over before returning. The default is `0`. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
        },
      },
      method: 'get',
      pathTemplate: '/v2/threads',
      executionParameters: [
        { name: 'record_id', in: 'query' },
        { name: 'object', in: 'query' },
        { name: 'entry_id', in: 'query' },
        { name: 'list', in: 'query' },
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['comment:read'] }],
    },
  ],
  [
    'getv2threadsbythreadid',
    {
      name: 'getv2threadsbythreadid',
      description: `Get all comments in a thread.

To view threads on records, you will need the \`object_configuration:read\` and \`record_permission:read\` scopes.

To view threads on list entries, you will need the \`list_configuration:read\` and \`list_entry:read\` scopes.

Required scopes: \`comment:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          thread_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID which identifies the thread.',
          },
        },
        required: ['thread_id'],
      },
      method: 'get',
      pathTemplate: '/v2/threads/{thread_id}',
      executionParameters: [{ name: 'thread_id', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['comment:read'] }],
    },
  ],
  [
    'postv2comments',
    {
      name: 'postv2comments',
      description: `Creates a new comment related to an existing thread, record or entry.

To create comments on records, you will need the \`object_configuration:read\` and \`record_permission:read\` scopes.

To create comments on list entries, you will need the \`list_configuration:read\` and \`list_entry:read\` scopes.

Required scopes: \`comment:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          requestBody: {
            type: 'object',
            properties: {
              data: {
                anyOf: [
                  {
                    type: 'object',
                    properties: {
                      format: {
                        type: 'string',
                        enum: ['plaintext'],
                        description:
                          'The format that the comment content is provided in. The `plaintext` format uses the line feed character `\\n` to create new lines within the note content. Rich text formatting and links are not supported.',
                      },
                      content: {
                        type: 'string',
                        description:
                          'The content of the comment itself. Workspace members can be mentioned using their email address, otherwise email addresses will be presented to users as clickable mailto links.',
                        example:
                          'If I put the email address of my colleague on Attio in here, e.g. alice@attio.com, they will be notified. Other emails (e.g. person@example.com) will be turned into clickable links.',
                      },
                      author: {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['workspace-member'] },
                          id: { type: 'string', format: 'uuid' },
                        },
                        required: ['type', 'id'],
                        description:
                          'The workspace member who wrote this comment. Note that other types of actors are not currently supported.',
                        example: {
                          type: 'workspace-member',
                          id: '50cf242c-7fa3-4cad-87d0-75b1af71c57b',
                        },
                      },
                      created_at: {
                        type: 'string',
                        description:
                          '`created_at` will default to the current time. However, if you wish to backdate a comment for migration or other purposes, you can override with a custom `created_at` value. Note that dates before 1970 or in the future are not allowed.',
                        example: '2023-01-01T15:00:00.000000000Z',
                      },
                      thread_id: {
                        type: 'string',
                        format: 'uuid',
                        description:
                          'If responding to an existing thread, this would be the ID of that thread.',
                        example: 'aa1dc1d9-93ac-4c6c-987e-16b6eea9aab2',
                      },
                    },
                    required: ['format', 'content', 'author', 'thread_id'],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      format: {
                        type: 'string',
                        enum: ['plaintext'],
                        description:
                          'The format that the comment content is provided in. The `plaintext` format uses the line feed character `\\n` to create new lines within the note content. Rich text formatting and links are not supported.',
                      },
                      content: {
                        type: 'string',
                        description:
                          'The content of the comment itself. Workspace members can be mentioned using their email address, otherwise email addresses will be presented to users as clickable mailto links.',
                        example:
                          'If I put the email address of my colleague on Attio in here, e.g. alice@attio.com, they will be notified. Other emails (e.g. person@example.com) will be turned into clickable links.',
                      },
                      author: {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['workspace-member'] },
                          id: { type: 'string', format: 'uuid' },
                        },
                        required: ['type', 'id'],
                        description:
                          'The workspace member who wrote this comment. Note that other types of actors are not currently supported.',
                        example: {
                          type: 'workspace-member',
                          id: '50cf242c-7fa3-4cad-87d0-75b1af71c57b',
                        },
                      },
                      created_at: {
                        type: 'string',
                        description:
                          '`created_at` will default to the current time. However, if you wish to backdate a comment for migration or other purposes, you can override with a custom `created_at` value. Note that dates before 1970 or in the future are not allowed.',
                        example: '2023-01-01T15:00:00.000000000Z',
                      },
                      record: {
                        type: 'object',
                        properties: {
                          object: {
                            type: 'string',
                            description:
                              'If creating a top-level comment on a record, this is the slug or ID of that object.',
                            example: '97052eb9-e65e-443f-a297-f2d9a4a7f795',
                          },
                          record_id: {
                            type: 'string',
                            format: 'uuid',
                            description:
                              'If creating a top-level comment on a record, this is the ID of that record.',
                            example: 'bf071e1f-6035-429d-b874-d83ea64ea13b',
                          },
                        },
                        required: ['object', 'record_id'],
                      },
                    },
                    required: ['format', 'content', 'author', 'record'],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      format: {
                        type: 'string',
                        enum: ['plaintext'],
                        description:
                          'The format that the comment content is provided in. The `plaintext` format uses the line feed character `\\n` to create new lines within the note content. Rich text formatting and links are not supported.',
                      },
                      content: {
                        type: 'string',
                        description:
                          'The content of the comment itself. Workspace members can be mentioned using their email address, otherwise email addresses will be presented to users as clickable mailto links.',
                        example:
                          'If I put the email address of my colleague on Attio in here, e.g. alice@attio.com, they will be notified. Other emails (e.g. person@example.com) will be turned into clickable links.',
                      },
                      author: {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['workspace-member'] },
                          id: { type: 'string', format: 'uuid' },
                        },
                        required: ['type', 'id'],
                        description:
                          'The workspace member who wrote this comment. Note that other types of actors are not currently supported.',
                        example: {
                          type: 'workspace-member',
                          id: '50cf242c-7fa3-4cad-87d0-75b1af71c57b',
                        },
                      },
                      created_at: {
                        type: 'string',
                        description:
                          '`created_at` will default to the current time. However, if you wish to backdate a comment for migration or other purposes, you can override with a custom `created_at` value. Note that dates before 1970 or in the future are not allowed.',
                        example: '2023-01-01T15:00:00.000000000Z',
                      },
                      entry: {
                        type: 'object',
                        properties: {
                          list: {
                            type: 'string',
                            description:
                              'If creating a top-level comment on a list entry, this is the slug or ID of that list.',
                            example: '33ebdbe9-e529-47c9-b894-0ba25e9c15c0',
                          },
                          entry_id: {
                            type: 'string',
                            description:
                              'If creating a top-level comment on a list entry, this is the ID of that entry.',
                            example: '2e6e29ea-c4e0-4f44-842d-78a891f8c156',
                          },
                        },
                        required: ['list', 'entry_id'],
                      },
                    },
                    required: ['format', 'content', 'author', 'entry'],
                    additionalProperties: false,
                  },
                ],
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/comments',
      executionParameters: [],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['comment:read-write'] }],
    },
  ],
  [
    'getv2commentsbycommentid',
    {
      name: 'getv2commentsbycommentid',
      description: `Get a single comment by ID.

To view comments on records, you will need the \`object_configuration:read\` and \`record_permission:read\` scopes.

To view comments on list entries, you will need the \`list_configuration:read\` and \`list_entry:read\` scopes.

Required scopes: \`comment:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          comment_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID which identifies the comment.',
          },
        },
        required: ['comment_id'],
      },
      method: 'get',
      pathTemplate: '/v2/comments/{comment_id}',
      executionParameters: [{ name: 'comment_id', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['comment:read'] }],
    },
  ],
  [
    'deletev2commentsbycommentid',
    {
      name: 'deletev2commentsbycommentid',
      description: `Deletes a comment by ID. If deleting a comment at the head of a thread, all messages in the thread are also deleted.

Required scopes: \`comment:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          comment_id: {
            type: 'string',
            format: 'uuid',
            description: 'The ID of the comment to delete.',
          },
        },
        required: ['comment_id'],
      },
      method: 'delete',
      pathTemplate: '/v2/comments/{comment_id}',
      executionParameters: [{ name: 'comment_id', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['comment:read-write'] }],
    },
  ],
  [
    'getv2webhooks',
    {
      name: 'getv2webhooks',
      description: `Get all of the webhooks in your workspace.

Required scopes: \`webhook:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description:
              'The maximum number of results to return, between 10 and 100, defaults to 10. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
          offset: {
            type: 'number',
            description:
              'The number of results to skip over before returning, defaults to 0. See the [full guide to pagination here](/rest-api/how-to/pagination).',
          },
        },
      },
      method: 'get',
      pathTemplate: '/v2/webhooks',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['webhook:read'] }],
    },
  ],
  [
    'postv2webhooks',
    {
      name: 'postv2webhooks',
      description: `Create a webhook and associated subscriptions.

Required scopes: \`webhook:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  target_url: {
                    type: 'string',
                    format: 'uri',
                    pattern: '^https:\\/\\/.*',
                    description: 'URL where the webhook events will be delivered to.',
                  },
                  subscriptions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        event_type: {
                          type: 'string',
                          enum: [
                            'comment.created',
                            'comment.resolved',
                            'comment.unresolved',
                            'comment.deleted',
                            'list.created',
                            'list.updated',
                            'list.deleted',
                            'list-attribute.created',
                            'list-attribute.updated',
                            'list-entry.created',
                            'list-entry.updated',
                            'list-entry.deleted',
                            'object-attribute.created',
                            'object-attribute.updated',
                            'note.created',
                            'note-content.updated',
                            'note.updated',
                            'note.deleted',
                            'record.created',
                            'record.merged',
                            'record.updated',
                            'record.deleted',
                            'task.created',
                            'task.updated',
                            'task.deleted',
                            'workspace-member.created',
                          ],
                          description: 'Type of event the webhook is subscribed to.',
                        },
                        filter: {
                          anyOf: [
                            {
                              type: 'object',
                              properties: {
                                $or: {
                                  type: 'array',
                                  items: {
                                    anyOf: [
                                      {
                                        type: 'object',
                                        properties: {
                                          field: { type: 'string' },
                                          operator: { type: 'string', enum: ['equals'] },
                                          value: { type: 'string' },
                                        },
                                        required: ['field', 'operator', 'value'],
                                      },
                                      {
                                        type: 'object',
                                        properties: {
                                          field: { type: 'string' },
                                          operator: { type: 'string', enum: ['not_equals'] },
                                          value: { type: 'string' },
                                        },
                                        required: ['field', 'operator', 'value'],
                                      },
                                    ],
                                  },
                                },
                              },
                              required: ['$or'],
                            },
                            {
                              type: 'object',
                              properties: {
                                $and: {
                                  type: 'array',
                                  items: {
                                    anyOf: [
                                      {
                                        type: 'object',
                                        properties: {
                                          field: { type: 'string' },
                                          operator: { type: 'string', enum: ['equals'] },
                                          value: { type: 'string' },
                                        },
                                        required: ['field', 'operator', 'value'],
                                      },
                                      {
                                        type: 'object',
                                        properties: {
                                          field: { type: 'string' },
                                          operator: { type: 'string', enum: ['not_equals'] },
                                          value: { type: 'string' },
                                        },
                                        required: ['field', 'operator', 'value'],
                                      },
                                    ],
                                  },
                                },
                              },
                              required: ['$and'],
                            },
                            { type: 'null' },
                          ],
                          description:
                            'Filters to determine whether the webhook event should be sent. If null, the filter always passes.',
                        },
                      },
                      required: ['event_type', 'filter'],
                    },
                    description: 'One or more events the webhook is subscribed to.',
                  },
                },
                required: ['target_url', 'subscriptions'],
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['requestBody'],
      },
      method: 'post',
      pathTemplate: '/v2/webhooks',
      executionParameters: [],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['webhook:read-write'] }],
    },
  ],
  [
    'getv2webhooksbywebhookid',
    {
      name: 'getv2webhooksbywebhookid',
      description: `Get a single webhook.

Required scopes: \`webhook:read\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          webhook_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID which identifies the webhook.',
          },
        },
        required: ['webhook_id'],
      },
      method: 'get',
      pathTemplate: '/v2/webhooks/{webhook_id}',
      executionParameters: [{ name: 'webhook_id', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['webhook:read'] }],
    },
  ],
  [
    'deletev2webhooksbywebhookid',
    {
      name: 'deletev2webhooksbywebhookid',
      description: `Delete a webhook by ID.

Required scopes: \`webhook:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          webhook_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID identifying the webhook to delete.',
          },
        },
        required: ['webhook_id'],
      },
      method: 'delete',
      pathTemplate: '/v2/webhooks/{webhook_id}',
      executionParameters: [{ name: 'webhook_id', in: 'path' }],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: ['webhook:read-write'] }],
    },
  ],
  [
    'patchv2webhooksbywebhookid',
    {
      name: 'patchv2webhooksbywebhookid',
      description: `Update a webhook and associated subscriptions.

Required scopes: \`webhook:read-write\`.`,
      inputSchema: {
        type: 'object',
        properties: {
          webhook_id: {
            type: 'string',
            format: 'uuid',
            description: 'A UUID which identifies the webhook.',
          },
          requestBody: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  target_url: {
                    type: 'string',
                    format: 'uri',
                    pattern: '^https:\\/\\/.*',
                    description: 'URL where the webhook events will be delivered to.',
                  },
                  subscriptions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        event_type: {
                          type: 'string',
                          enum: [
                            'comment.created',
                            'comment.resolved',
                            'comment.unresolved',
                            'comment.deleted',
                            'list.created',
                            'list.updated',
                            'list.deleted',
                            'list-attribute.created',
                            'list-attribute.updated',
                            'list-entry.created',
                            'list-entry.updated',
                            'list-entry.deleted',
                            'object-attribute.created',
                            'object-attribute.updated',
                            'note.created',
                            'note-content.updated',
                            'note.updated',
                            'note.deleted',
                            'record.created',
                            'record.merged',
                            'record.updated',
                            'record.deleted',
                            'task.created',
                            'task.updated',
                            'task.deleted',
                            'workspace-member.created',
                          ],
                          description: 'Type of event the webhook is subscribed to.',
                        },
                        filter: {
                          anyOf: [
                            {
                              type: 'object',
                              properties: {
                                $or: {
                                  type: 'array',
                                  items: {
                                    anyOf: [
                                      {
                                        type: 'object',
                                        properties: {
                                          field: { type: 'string' },
                                          operator: { type: 'string', enum: ['equals'] },
                                          value: { type: 'string' },
                                        },
                                        required: ['field', 'operator', 'value'],
                                      },
                                      {
                                        type: 'object',
                                        properties: {
                                          field: { type: 'string' },
                                          operator: { type: 'string', enum: ['not_equals'] },
                                          value: { type: 'string' },
                                        },
                                        required: ['field', 'operator', 'value'],
                                      },
                                    ],
                                  },
                                },
                              },
                              required: ['$or'],
                            },
                            {
                              type: 'object',
                              properties: {
                                $and: {
                                  type: 'array',
                                  items: {
                                    anyOf: [
                                      {
                                        type: 'object',
                                        properties: {
                                          field: { type: 'string' },
                                          operator: { type: 'string', enum: ['equals'] },
                                          value: { type: 'string' },
                                        },
                                        required: ['field', 'operator', 'value'],
                                      },
                                      {
                                        type: 'object',
                                        properties: {
                                          field: { type: 'string' },
                                          operator: { type: 'string', enum: ['not_equals'] },
                                          value: { type: 'string' },
                                        },
                                        required: ['field', 'operator', 'value'],
                                      },
                                    ],
                                  },
                                },
                              },
                              required: ['$and'],
                            },
                            { type: 'null' },
                          ],
                          description:
                            'Filters to determine whether the webhook event should be sent. If null, the filter always passes.',
                        },
                      },
                      required: ['event_type', 'filter'],
                    },
                    description: 'One or more events the webhook is subscribed to.',
                  },
                },
              },
            },
            required: ['data'],
            description: 'The JSON request body.',
          },
        },
        required: ['webhook_id', 'requestBody'],
      },
      method: 'patch',
      pathTemplate: '/v2/webhooks/{webhook_id}',
      executionParameters: [{ name: 'webhook_id', in: 'path' }],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ oauth2: ['webhook:read-write'] }],
    },
  ],
  [
    'getv2self',
    {
      name: 'getv2self',
      description: `Identify the current access token, the workspace it is linked to, and any permissions it has.`,
      inputSchema: { type: 'object', properties: {} },
      method: 'get',
      pathTemplate: '/v2/self',
      executionParameters: [],
      requestBodyContentType: undefined,
      securityRequirements: [{ oauth2: [] }],
    },
  ],
]);

/**
 * Security schemes from the OpenAPI spec
 */
const securitySchemes = {
  oauth2: {
    type: 'oauth2',
    description: 'This API uses OAuth 2.0 with the authorization code grant flow.',
    flows: {
      authorizationCode: {
        authorizationUrl: 'https://app.attio.com/authorize',
        tokenUrl: 'https://app.attio.com/oauth/token',
        scopes: {
          'user_management:read': 'View workspace members.',
          'user_management:read-write': 'View workspace members.',
          'record_permission:read': 'View, and optionally write, records.',
          'record_permission:read-write': 'View, and optionally write, records.',
          'object_configuration:read':
            'View, and optionally write, the configuration and attributes of objects.',
          'object_configuration:read-write':
            'View, and optionally write, the configuration and attributes of objects.',
          'list_entry:read': 'View, and optionally write, the entries in a list.',
          'list_entry:read-write': 'View, and optionally write, the entries in a list.',
          'list_configuration:read':
            'View, and optionally write, the configuration and attributes of lists.',
          'list_configuration:read-write':
            'View, and optionally write, the configuration and attributes of lists.',
          'public_collection:read':
            'View, and optionally write, both the settings and information within public collections.',
          'public_collection:read-write':
            'View, and optionally write, both the settings and information within public collections.',
          'private_collection:read':
            'View, and optionally modify, both the settings and information of all collections within the workspace, regardless of their access settings.',
          'private_collection:read-write':
            'View, and optionally modify, both the settings and information of all collections within the workspace, regardless of their access settings.',
          'comment:read': 'View comments (and threads), and optionally write comments.',
          'comment:read-write': 'View comments (and threads), and optionally write comments.',
          'task:read': 'View, and optionally write, tasks.',
          'task:read-write': 'View, and optionally write, tasks.',
          'note:read': 'View, and optionally write, notes.',
          'note:read-write': 'View, and optionally write, notes.',
          'webhook:read': 'View, and optionally manage, webhooks.',
          'webhook:read-write': 'View, and optionally manage, webhooks.',
        },
      },
    },
  },
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const toolsForClient: Tool[] = Array.from(toolDefinitionMap.values()).map((def) => {
    const transformation = transformToolName(def.name);
    return {
      name: transformation.humanReadableName,
      description: `[${transformation.category}] ${def.description}`,
      inputSchema: def.inputSchema,
    };
  });
  
  // Sort tools by method order within categories
  toolsForClient.sort((a, b) => {
    // Extract category from description
    const categoryA = a.description?.match(/^\[([^\]]+)\]/)?.[1] || 'Other';
    const categoryB = b.description?.match(/^\[([^\]]+)\]/)?.[1] || 'Other';
    
    // First sort by category
    if (categoryA !== categoryB) {
      return categoryA.localeCompare(categoryB);
    }
    
    // Within the same category, sort by method order
    const methodA = a.name.split('_')[0];
    const methodB = b.name.split('_')[0];
    
    const methodOrder = ['list', 'get', 'create', 'update', 'delete', 'query'];
    const orderA = methodOrder.indexOf(methodA);
    const orderB = methodOrder.indexOf(methodB);
    
    if (orderA !== -1 && orderB !== -1) {
      if (orderA !== orderB) {
        return orderA - orderB;
      }
    } else if (orderA !== -1) {
      return -1;
    } else if (orderB !== -1) {
      return 1;
    }
    
    return a.name.localeCompare(b.name);
  });
  
  return { tools: toolsForClient };
});

server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest): Promise<CallToolResult> => {
    const { name: toolName, arguments: toolArgs } = request.params;
    const toolDefinition = toolDefinitionMap.get(toolName);
    if (!toolDefinition) {
      console.error(`Error: Unknown tool requested: ${toolName}`);
      return { content: [{ type: 'text', text: `Error: Unknown tool requested: ${toolName}` }] };
    }
    return await executeApiTool(toolName, toolDefinition, toolArgs ?? {}, securitySchemes);
  }
);

// OAuth2 token acquisition function removed - using direct access token instead

/**
 * Executes an API tool with the provided arguments
 *
 * @param toolName Name of the tool to execute
 * @param definition Tool definition
 * @param toolArgs Arguments provided by the user
 * @param allSecuritySchemes Security schemes from the OpenAPI spec
 * @returns Call tool result
 */
async function executeApiTool(
  toolName: string,
  definition: McpToolDefinition,
  toolArgs: JsonObject,
  allSecuritySchemes: Record<string, any>
): Promise<CallToolResult> {
  try {
    // Validate arguments against the input schema
    let validatedArgs: JsonObject;
    try {
      const zodSchema = getZodSchemaFromJsonSchema(definition.inputSchema, toolName);
      const argsToParse = typeof toolArgs === 'object' && toolArgs !== null ? toolArgs : {};
      validatedArgs = zodSchema.parse(argsToParse);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const validationErrorMessage = `Invalid arguments for tool '${toolName}': ${error.errors.map((e) => `${e.path.join('.')} (${e.code}): ${e.message}`).join(', ')}`;
        return { content: [{ type: 'text', text: validationErrorMessage }] };
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: 'text', text: `Internal error during validation setup: ${errorMessage}` },
          ],
        };
      }
    }

    // Prepare URL, query parameters, headers, and request body
    let urlPath = definition.pathTemplate;
    const queryParams: Record<string, any> = {};
    const headers: Record<string, string> = { Accept: 'application/json' };
    let requestBodyData: any = undefined;

    // Apply parameters to the URL path, query, or headers
    definition.executionParameters.forEach((param) => {
      const value = validatedArgs[param.name];
      if (typeof value !== 'undefined' && value !== null) {
        if (param.in === 'path') {
          urlPath = urlPath.replace(`{${param.name}}`, encodeURIComponent(String(value)));
        } else if (param.in === 'query') {
          queryParams[param.name] = value;
        } else if (param.in === 'header') {
          headers[param.name.toLowerCase()] = String(value);
        }
      }
    });

    // Ensure all path parameters are resolved
    if (urlPath.includes('{')) {
      throw new Error(`Failed to resolve path parameters: ${urlPath}`);
    }

    // Construct the full URL
    const requestUrl = API_BASE_URL ? `${API_BASE_URL}${urlPath}` : urlPath;

    // Handle request body if needed
    if (definition.requestBodyContentType && typeof validatedArgs['requestBody'] !== 'undefined') {
      requestBodyData = validatedArgs['requestBody'];
      headers['content-type'] = definition.requestBodyContentType;
    }

    // Apply security requirements if available
    // Security requirements use OR between array items and AND within each object
    const appliedSecurity = definition.securityRequirements?.find((req) => {
      // Try each security requirement (combined with OR)
      return Object.entries(req).every(([schemeName, _scopesArray]) => {
        const scheme = allSecuritySchemes[schemeName];
        if (!scheme) return false;

        // API Key security (header, query, cookie)
        if (scheme.type === 'apiKey') {
          return !!process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
        }

        // HTTP security (basic, bearer)
        if (scheme.type === 'http') {
          if (scheme.scheme?.toLowerCase() === 'bearer') {
            return !!process.env[
              `BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
            ];
          } else if (scheme.scheme?.toLowerCase() === 'basic') {
            return (
              !!process.env[
                `BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ] &&
              !!process.env[
                `BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ]
            );
          }
        }

        // OAuth2 security
        if (scheme.type === 'oauth2') {
          // Check for Attio access token (AsyncLocalStorage for HTTP mode, env for stdio)
          if (attioTokenStore.getStore() || process.env.ATTIO_ACCESS_TOKEN) {
            return true;
          }

          // Check for client credentials for auto-acquisition
          if (
            process.env[
              `OAUTH_CLIENT_ID_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
            ] &&
            process.env[
              `OAUTH_CLIENT_SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
            ]
          ) {
            // Verify we have a supported flow
            if (scheme.flows?.clientCredentials || scheme.flows?.password) {
              return true;
            }
          }

          return false;
        }

        // OpenID Connect
        if (scheme.type === 'openIdConnect') {
          return !!process.env[
            `OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
          ];
        }

        return false;
      });
    });

    // If we found matching security scheme(s), apply them
    if (appliedSecurity) {
      // Apply each security scheme from this requirement (combined with AND)
      for (const [schemeName, scopesArray] of Object.entries(appliedSecurity)) {
        const scheme = allSecuritySchemes[schemeName];

        // API Key security
        if (scheme?.type === 'apiKey') {
          const apiKey =
            process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
          if (apiKey) {
            if (scheme.in === 'header') {
              headers[scheme.name.toLowerCase()] = apiKey;
              console.error(`Applied API key '${schemeName}' in header '${scheme.name}'`);
            } else if (scheme.in === 'query') {
              queryParams[scheme.name] = apiKey;
              console.error(`Applied API key '${schemeName}' in query parameter '${scheme.name}'`);
            } else if (scheme.in === 'cookie') {
              // Add the cookie, preserving other cookies if they exist
              headers['cookie'] =
                `${scheme.name}=${apiKey}${headers['cookie'] ? `; ${headers['cookie']}` : ''}`;
              console.error(`Applied API key '${schemeName}' in cookie '${scheme.name}'`);
            }
          }
        }
        // HTTP security (Bearer or Basic)
        else if (scheme?.type === 'http') {
          if (scheme.scheme?.toLowerCase() === 'bearer') {
            const token =
              process.env[`BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
            if (token) {
              headers['authorization'] = `Bearer ${token}`;
              console.error(`Applied Bearer token for '${schemeName}'`);
            }
          } else if (scheme.scheme?.toLowerCase() === 'basic') {
            const username =
              process.env[
                `BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ];
            const password =
              process.env[
                `BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ];
            if (username && password) {
              headers['authorization'] =
                `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
              console.error(`Applied Basic authentication for '${schemeName}'`);
            }
          }
        }
        // OAuth2 security
        else if (scheme?.type === 'oauth2') {
          // Use Attio workspace access token (AsyncLocalStorage for HTTP mode, env for stdio)
          let token = attioTokenStore.getStore() || process.env.ATTIO_ACCESS_TOKEN;

          // Apply token if available
          if (token) {
            headers['authorization'] = `Bearer ${token}`;
            console.error(`Applied OAuth2 token for '${schemeName}'`);

            // List the scopes that were requested, if any
            const scopes = scopesArray as string[];
            if (scopes && scopes.length > 0) {
              console.error(`Requested scopes: ${scopes.join(', ')}`);
            }
          }
        }
        // OpenID Connect
        else if (scheme?.type === 'openIdConnect') {
          const token =
            process.env[`OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
          if (token) {
            headers['authorization'] = `Bearer ${token}`;
            console.error(`Applied OpenID Connect token for '${schemeName}'`);

            // List the scopes that were requested, if any
            const scopes = scopesArray as string[];
            if (scopes && scopes.length > 0) {
              console.error(`Requested scopes: ${scopes.join(', ')}`);
            }
          }
        }
      }
    }
    // Log warning if security is required but not available
    else if (definition.securityRequirements?.length > 0) {
      // First generate a more readable representation of the security requirements
      const securityRequirementsString = definition.securityRequirements
        .map((req) => {
          const parts = Object.entries(req)
            .map(([name, scopesArray]) => {
              const scopes = scopesArray as string[];
              if (scopes.length === 0) return name;
              return `${name} (scopes: ${scopes.join(', ')})`;
            })
            .join(' AND ');
          return `[${parts}]`;
        })
        .join(' OR ');

      console.warn(
        `Tool '${toolName}' requires security: ${securityRequirementsString}, but no suitable credentials found.`
      );
    }

    // Prepare the axios request configuration
    const config: AxiosRequestConfig = {
      method: definition.method.toUpperCase(),
      url: requestUrl,
      params: queryParams,
      headers: headers,
      ...(requestBodyData !== undefined && { data: requestBodyData }),
    };

    // Log request info to stderr (doesn't affect MCP output)
    console.error(`Executing tool "${toolName}": ${config.method} ${config.url}`);

    // Execute the request
    const response = await axios(config);

    // Process and format the response
    let responseText = '';
    const contentType = response.headers['content-type']?.toLowerCase() || '';

    // Handle JSON responses
    if (
      contentType.includes('application/json') &&
      typeof response.data === 'object' &&
      response.data !== null
    ) {
      try {
        responseText = JSON.stringify(response.data, null, 2);
      } catch (_e) {
        responseText = '[Stringify Error]';
      }
    }
    // Handle string responses
    else if (typeof response.data === 'string') {
      responseText = response.data;
    }
    // Handle other response types
    else if (response.data !== undefined && response.data !== null) {
      responseText = String(response.data);
    }
    // Handle empty responses
    else {
      responseText = `(Status: ${response.status} - No body content)`;
    }

    // Return formatted response
    return {
      content: [
        {
          type: 'text',
          text: `API Response (Status: ${response.status}):\n${responseText}`,
        },
      ],
    };
  } catch (error: unknown) {
    // Handle errors during execution
    let errorMessage: string;

    // Format Axios errors specially
    if (axios.isAxiosError(error)) {
      errorMessage = formatApiError(error);
    }
    // Handle standard errors
    else if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Handle unexpected error types
    else {
      errorMessage = 'Unexpected error: ' + String(error);
    }

    // Log error to stderr
    console.error(`Error during execution of tool '${toolName}':`, errorMessage);

    // Return error message to client
    return { content: [{ type: 'text', text: errorMessage }] };
  }
}

/**
 * Main function to start the stdio server
 */
export async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(
      `${SERVER_NAME} MCP Server (v${SERVER_VERSION}) running on stdio${API_BASE_URL ? `, proxying API at ${API_BASE_URL}` : ''}`
    );
  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1);
  }
}

export { toolDefinitionMap, securitySchemes, executeApiTool };

/**
 * Formats API errors for better readability
 *
 * @param error Axios error
 * @returns Formatted error message
 */
function formatApiError(error: AxiosError): string {
  let message = 'API request failed.';
  if (error.response) {
    message = `API Error: Status ${error.response.status} (${error.response.statusText || 'Status text not available'}). `;
    const responseData = error.response.data;
    const MAX_LEN = 200;
    if (typeof responseData === 'string') {
      message += `Response: ${responseData.substring(0, MAX_LEN)}${responseData.length > MAX_LEN ? '...' : ''}`;
    } else if (responseData) {
      try {
        const jsonString = JSON.stringify(responseData);
        message += `Response: ${jsonString.substring(0, MAX_LEN)}${jsonString.length > MAX_LEN ? '...' : ''}`;
      } catch {
        message += 'Response: [Could not serialize data]';
      }
    } else {
      message += 'No response body received.';
    }
  } else if (error.request) {
    message = 'API Network Error: No response received from server.';
    if (error.code) message += ` (Code: ${error.code})`;
  } else {
    message += `API Request Setup Error: ${error.message}`;
  }
  return message;
}

/**
 * Converts a JSON Schema to a Zod schema for runtime validation
 *
 * @param jsonSchema JSON Schema
 * @param toolName Tool name for error reporting
 * @returns Zod schema
 */
function getZodSchemaFromJsonSchema(jsonSchema: any, toolName: string): z.ZodTypeAny {
  if (typeof jsonSchema !== 'object' || jsonSchema === null) {
    return z.object({}).passthrough();
  }
  try {
    const zodSchemaString = jsonSchemaToZod(jsonSchema);
    const zodSchema = eval(zodSchemaString);
    if (typeof zodSchema?.parse !== 'function') {
      throw new Error('Eval did not produce a valid Zod schema.');
    }
    return zodSchema as z.ZodTypeAny;
  } catch (err: any) {
    console.error(`Failed to generate/evaluate Zod schema for '${toolName}':`, err);
    return z.object({}).passthrough();
  }
}
