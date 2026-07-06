/**
 * Tool Name Transformer for Attio MCP Server
 * Transforms auto-generated OpenAPI tool names into human-readable, organized names
 */

export interface ToolTransformation {
  originalName: string;
  humanReadableName: string;
  category: string;
  description?: string;
}

/**
 * Converts plural resource names to singular
 */
function getSingular(resourceName: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    Attribute_Statuses: 'Attribute_Status',
    List_Entries: 'List_Entry',
    List_Entry_Attribute_Values: 'List_Entry_Attribute_Values',
    Record_Attribute_Values: 'Record_Attribute_Values',
    Record_Entries: 'Record_Entries',
    Current_User: 'Current_User',
  };

  if (specialCases[resourceName]) {
    return specialCases[resourceName];
  }

  // Handle regular plurals
  if (resourceName.endsWith('ies')) {
    return resourceName.slice(0, -3) + 'y';
  } else if (resourceName.endsWith('ses')) {
    return resourceName.slice(0, -2);
  } else if (resourceName.endsWith('s')) {
    return resourceName.slice(0, -1);
  }

  return resourceName;
}

/**
 * Explicit name overrides.
 *
 * The generic transformer below maps every PUT/PATCH to "Update", which made the
 * three record-update variants (PUT collection = assert, PUT by id = overwrite
 * multiselect values, PATCH by id = append multiselect values) all collide on
 * `update_record` — and likewise for list entries. MCP clients (e.g. n8n's MCP
 * trigger) reject duplicate tool names, so these six get distinct names here.
 *
 * Newer API surfaces (meetings, call recordings, files, views, search, SQL)
 * also get explicit names since their paths don't fit the legacy patterns.
 */
const explicitTransformations: Record<string, { humanReadableName: string; category: string }> = {
  // Record update variants
  putv2objectsrecords: { humanReadableName: 'assert_record', category: 'Records' },
  putv2objectsrecordsbyrecordid: { humanReadableName: 'overwrite_record', category: 'Records' },
  patchv2objectsrecordsbyrecordid: { humanReadableName: 'update_record', category: 'Records' },
  // List entry update variants
  putv2listsentries: { humanReadableName: 'assert_list_entry', category: 'List Entries' },
  putv2listsentriesbyentryid: {
    humanReadableName: 'overwrite_list_entry',
    category: 'List Entries',
  },
  patchv2listsentriesbyentryid: {
    humanReadableName: 'update_list_entry',
    category: 'List Entries',
  },
  // Meetings & call recordings
  getv2meetings: { humanReadableName: 'list_meetings', category: 'Meetings' },
  getv2meetingsbymeetingid: { humanReadableName: 'get_meeting', category: 'Meetings' },
  postv2meetings: { humanReadableName: 'create_meeting', category: 'Meetings' },
  getv2meetingscallrecordings: {
    humanReadableName: 'list_call_recordings',
    category: 'Meetings',
  },
  postv2meetingscallrecordings: {
    humanReadableName: 'create_call_recording',
    category: 'Meetings',
  },
  getv2meetingscallrecordingsbycallrecordingid: {
    humanReadableName: 'get_call_recording',
    category: 'Meetings',
  },
  deletev2meetingscallrecordingsbycallrecordingid: {
    humanReadableName: 'delete_call_recording',
    category: 'Meetings',
  },
  getv2meetingscallrecordingstranscript: {
    humanReadableName: 'get_call_transcript',
    category: 'Meetings',
  },
  // Files
  getv2files: { humanReadableName: 'list_files', category: 'Files' },
  postv2files: { humanReadableName: 'create_file', category: 'Files' },
  getv2filesbyfileid: { humanReadableName: 'get_file', category: 'Files' },
  getv2filesdownload: { humanReadableName: 'download_file', category: 'Files' },
  deletev2filesbyfileid: { humanReadableName: 'delete_file', category: 'Files' },
  // Views
  getv2listsviews: { humanReadableName: 'list_list_views', category: 'Lists' },
  getv2objectsviews: { humanReadableName: 'list_object_views', category: 'Objects' },
  // Search & SQL
  postv2objectsrecordssearch: { humanReadableName: 'search_records', category: 'Records' },
  postv2sql: { humanReadableName: 'query_sql', category: 'Reporting' },
};

/**
 * Transforms a tool name from OpenAPI format to human-readable format
 * Examples:
 * - getv2objects -> List Objects
 * - postv2objects -> Create Object
 * - patchv2objectsbyobject -> Update Object
 * - deletev2objectsrecordsbyrecordid -> Delete Record
 */
export function transformToolName(originalName: string): ToolTransformation {
  const explicit = explicitTransformations[originalName];
  if (explicit) {
    return { originalName, ...explicit };
  }

  // Extract the HTTP method and resource parts
  const methodMatch = originalName.match(/^(get|post|put|patch|delete)v2(.+)$/);
  if (!methodMatch) {
    return {
      originalName,
      humanReadableName: originalName,
      category: 'Other',
    };
  }

  const method = methodMatch[1];
  const resourcePath = methodMatch[2];

  // Determine the main resource type
  const resourceCategories = {
    objectsrecords: 'Records', // Check this before 'objects'
    listsentries: 'List Entries', // Check this before 'lists'
    objects: 'Objects',
    attributes: 'Attributes',
    lists: 'Lists',
    records: 'Records',
    entries: 'List Entries',
    workspacemembers: 'Workspace',
    notes: 'Notes',
    tasks: 'Tasks',
    threads: 'Threads',
    comments: 'Comments',
    webhooks: 'Webhooks',
    self: 'Authentication',
  };

  let category = 'Other';
  let _mainResource = '';

  // Find the main resource from the path (check compound resources first)
  for (const [key, cat] of Object.entries(resourceCategories)) {
    if (resourcePath.startsWith(key)) {
      category = cat;
      _mainResource = key;
      break;
    }
  }

  // Build human-readable name based on HTTP method
  const methodMap: Record<string, string> = {
    get: 'List',
    post: 'Create',
    put: 'Update',
    patch: 'Update',
    delete: 'Delete',
  };

  let action = methodMap[method] || method;

  // Handle special cases and patterns
  let humanReadableName = '';
  let resourceType = '';

  // Handle "by" patterns (e.g., getv2objectsbyobject)
  if (resourcePath.includes('by')) {
    const parts = resourcePath.split('by');
    resourceType = parts[0];
    const identifier = parts[1];

    // Special handling for single item retrieval
    if (method === 'get' && identifier) {
      action = 'Get';
    }
  } else {
    resourceType = resourcePath;
  }

  // Clean up resource type names
  const resourceNameMap: Record<string, string> = {
    objects: 'Objects',
    objectsrecords: 'Records',
    objectsrecordsattributesvalues: 'Record_Attribute_Values',
    objectsrecordsentries: 'Record_Entries',
    attributes: 'Attributes',
    attributesoptions: 'Attribute_Options',
    attributesstatuses: 'Attribute_Statuses',
    lists: 'Lists',
    listsentries: 'List_Entries',
    listsentriesattributesvalues: 'List_Entry_Attribute_Values',
    workspacemembers: 'Workspace_Members',
    notes: 'Notes',
    tasks: 'Tasks',
    threads: 'Comment_Threads',
    comments: 'Comments',
    webhooks: 'Webhooks',
    self: 'Current_User',
  };

  // Special handling for query endpoints
  if (resourcePath.endsWith('query')) {
    action = 'Query';
    resourceType = resourceType.replace('query', '');
  }

  // Get clean resource name
  const cleanResourceName =
    resourceNameMap[resourceType] ||
    resourceType.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/^./, (str) => str.toUpperCase());

  // Build the human-readable name
  if (resourcePath === 'self') {
    // Special case for self endpoint
    humanReadableName = 'Get_Current_User';
  } else if (action === 'List' && !resourcePath.includes('by')) {
    // For listing multiple items
    humanReadableName = `${action}_${cleanResourceName.replace(/\s+/g, '_')}`;
  } else if (action === 'Get' || (action === 'List' && resourcePath.includes('by'))) {
    // For getting a single item
    const singular = getSingular(cleanResourceName);
    humanReadableName = `${action}_${singular.replace(/\s+/g, '_')}`;
  } else if (action === 'Create') {
    // For creating items
    const singular = getSingular(cleanResourceName);
    humanReadableName = `${action}_${singular.replace(/\s+/g, '_')}`;
  } else if (action === 'Query') {
    humanReadableName = `${action}_${cleanResourceName.replace(/\s+/g, '_')}`;
  } else {
    // For update/delete operations
    const singular = getSingular(cleanResourceName);
    humanReadableName = `${action}_${singular.replace(/\s+/g, '_')}`;
  }

  return {
    originalName,
    humanReadableName: humanReadableName.toLowerCase(),
    category,
  };
}

/**
 * Get all tool transformations for the Attio MCP server
 */
export function getAllToolTransformations(toolNames: string[]): Map<string, ToolTransformation> {
  const transformations = new Map<string, ToolTransformation>();

  for (const toolName of toolNames) {
    transformations.set(toolName, transformToolName(toolName));
  }

  return transformations;
}

/**
 * Groups tools by category for better organization
 */
export function groupToolsByCategory(
  transformations: Map<string, ToolTransformation>
): Map<string, ToolTransformation[]> {
  const grouped = new Map<string, ToolTransformation[]>();

  for (const transformation of transformations.values()) {
    const category = transformation.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(transformation);
  }

  // Sort tools within each category by method first, then by resource name
  for (const [_category, tools] of grouped.entries()) {
    tools.sort((a, b) => {
      // Extract method (first part before underscore)
      const methodA = a.humanReadableName.split('_')[0];
      const methodB = b.humanReadableName.split('_')[0];

      // Define method priority order
      const methodOrder = ['list', 'get', 'create', 'update', 'delete', 'query'];
      const orderA = methodOrder.indexOf(methodA);
      const orderB = methodOrder.indexOf(methodB);

      // If both methods are in our defined order, sort by that order
      if (orderA !== -1 && orderB !== -1) {
        if (orderA !== orderB) {
          return orderA - orderB;
        }
      }
      // If one method is in our order and the other isn't, prioritize the ordered one
      else if (orderA !== -1) {
        return -1;
      } else if (orderB !== -1) {
        return 1;
      }

      // If methods are the same or both not in our defined order, sort alphabetically
      return a.humanReadableName.localeCompare(b.humanReadableName);
    });
  }

  return grouped;
}
