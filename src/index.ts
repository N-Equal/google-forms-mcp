#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Request
} from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Get authentication information from environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN environment variables are required');
}

class GoogleFormsServer {
  private server: Server;
  private oauth2Client: OAuth2Client;
  private forms: any;

  constructor() {
    this.server = new Server(
      {
        name: 'google-forms-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET
    );
    this.oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN
    });

    // Initialize Google Forms API
    this.forms = google.forms({
      version: 'v1',
      auth: this.oauth2Client
    });

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error: Error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_form',
          description: 'Create a new Google Form',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Form title',
              },
              description: {
                type: 'string',
                description: 'Form description (optional)',
              }
            },
            required: ['title'],
          },
        },
        {
          name: 'add_text_question',
          description: 'Add a text question to the form',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              },
              questionTitle: {
                type: 'string',
                description: 'Question title',
              },
              required: {
                type: 'boolean',
                description: 'Whether required (optional, default is false)',
              }
            },
            required: ['formId', 'questionTitle'],
          },
        },
        {
          name: 'add_multiple_choice_question',
          description: 'Add a multiple choice question to the form',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              },
              questionTitle: {
                type: 'string',
                description: 'Question title',
              },
              options: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of choices',
              },
              required: {
                type: 'boolean',
                description: 'Whether required (optional, default is false)',
              }
            },
            required: ['formId', 'questionTitle', 'options'],
          },
        },
        {
          name: 'get_form',
          description: 'Get form details',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              }
            },
            required: ['formId'],
          },
        },
        {
          name: 'get_form_responses',
          description: 'Get form responses',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              }
            },
            required: ['formId'],
          },
        },
        {
          name: 'add_checkbox_question',
          description: 'Add a checkbox (multi-select) question to the form',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              },
              questionTitle: {
                type: 'string',
                description: 'Question title',
              },
              options: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of choices',
              },
              required: {
                type: 'boolean',
                description: 'Whether required (optional, default is false)',
              }
            },
            required: ['formId', 'questionTitle', 'options'],
          },
        },
        {
          name: 'add_dropdown_question',
          description: 'Add a dropdown selection question to the form',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              },
              questionTitle: {
                type: 'string',
                description: 'Question title',
              },
              options: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of choices',
              },
              required: {
                type: 'boolean',
                description: 'Whether required (optional, default is false)',
              }
            },
            required: ['formId', 'questionTitle', 'options'],
          },
        },
        {
          name: 'add_scale_question',
          description: 'Add a linear scale question to the form',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              },
              questionTitle: {
                type: 'string',
                description: 'Question title',
              },
              low: {
                type: 'number',
                description: 'Lowest value on the scale (typically 0 or 1)',
              },
              high: {
                type: 'number',
                description: 'Highest value on the scale (typically 5 or 10)',
              },
              lowLabel: {
                type: 'string',
                description: 'Label for lowest value (optional, e.g., "Strongly disagree")',
              },
              highLabel: {
                type: 'string',
                description: 'Label for highest value (optional, e.g., "Strongly agree")',
              },
              required: {
                type: 'boolean',
                description: 'Whether required (optional, default is false)',
              }
            },
            required: ['formId', 'questionTitle', 'low', 'high'],
          },
        },
        {
          name: 'add_text_item',
          description: 'Add a text item (static text/description block) to the form',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              },
              title: {
                type: 'string',
                description: 'Text item title',
              },
              description: {
                type: 'string',
                description: 'Text item description (optional)',
              }
            },
            required: ['formId', 'title'],
          },
        },
        {
          name: 'add_section',
          description: 'Add a section (page break) to the form for better organization',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              },
              title: {
                type: 'string',
                description: 'Section title',
              },
              description: {
                type: 'string',
                description: 'Section description (optional)',
              }
            },
            required: ['formId', 'title'],
          },
        },
        {
          name: 'update_form_info',
          description: 'Update form title and/or description',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              },
              title: {
                type: 'string',
                description: 'New form title (optional)',
              },
              description: {
                type: 'string',
                description: 'New form description (optional)',
              }
            },
            required: ['formId'],
          },
        },
        {
          name: 'delete_question',
          description: 'Delete a question from the form by its index',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              },
              index: {
                type: 'number',
                description: 'Index of the question to delete (0-based)',
              }
            },
            required: ['formId', 'index'],
          },
        },
        {
          name: 'update_question',
          description: 'Update an existing question in the form',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              },
              index: {
                type: 'number',
                description: 'Index of the question to update (0-based)',
              },
              questionTitle: {
                type: 'string',
                description: 'New question title (optional)',
              },
              description: {
                type: 'string',
                description: 'New question description (optional)',
              },
              required: {
                type: 'boolean',
                description: 'Whether required (optional)',
              }
            },
            required: ['formId', 'index'],
          },
        },
        {
          name: 'move_question',
          description: 'Move a question to a new position in the form',
          inputSchema: {
            type: 'object',
            properties: {
              formId: {
                type: 'string',
                description: 'Form ID',
              },
              fromIndex: {
                type: 'number',
                description: 'Current index of the question (0-based)',
              },
              toIndex: {
                type: 'number',
                description: 'Target index for the question (0-based)',
              }
            },
            required: ['formId', 'fromIndex', 'toIndex'],
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      try {
        switch (request.params.name) {
          case 'create_form':
            return await this.createForm(request.params.arguments);
          case 'add_text_question':
            return await this.addTextQuestion(request.params.arguments);
          case 'add_multiple_choice_question':
            return await this.addMultipleChoiceQuestion(request.params.arguments);
          case 'get_form':
            return await this.getForm(request.params.arguments);
          case 'get_form_responses':
            return await this.getFormResponses(request.params.arguments);
          case 'add_checkbox_question':
            return await this.addCheckboxQuestion(request.params.arguments);
          case 'add_dropdown_question':
            return await this.addDropdownQuestion(request.params.arguments);
          case 'add_scale_question':
            return await this.addScaleQuestion(request.params.arguments);
          case 'add_text_item':
            return await this.addTextItem(request.params.arguments);
          case 'add_section':
            return await this.addSection(request.params.arguments);
          case 'update_form_info':
            return await this.updateFormInfo(request.params.arguments);
          case 'delete_question':
            return await this.deleteQuestion(request.params.arguments);
          case 'update_question':
            return await this.updateQuestion(request.params.arguments);
          case 'move_question':
            return await this.moveQuestion(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error: any) {
        console.error('Error in tool execution:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message || 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async createForm(args: any) {
    if (!args.title) {
      throw new McpError(ErrorCode.InvalidParams, 'Title is required');
    }

    const form: any = {
      info: {
        title: args.title,
        documentTitle: args.title,
      }
    };

    if (args.description) {
      form.info.description = args.description;
    }

    try {
      const response = await this.forms.forms.create({
        requestBody: form,
      });

      const formId = response.data.formId;
      const responderUri = `https://docs.google.com/forms/d/${formId}/viewform`;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              formId,
              title: args.title,
              description: args.description || '',
              responderUri,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error creating form:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create form: ${error.message}`
      );
    }
  }

  private async addTextQuestion(args: any) {
    if (!args.formId || !args.questionTitle) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Form ID and question title are required'
      );
    }

    try {
      // Get the current form
      const form = await this.forms.forms.get({
        formId: args.formId,
      });

      // Create a request to add a new question
      const updateRequest = {
        requests: [
          {
            createItem: {
              item: {
                title: args.questionTitle,
                questionItem: {
                  question: {
                    required: args.required || false,
                    textQuestion: {}
                  }
                }
              },
              location: {
                index: 0
              }
            }
          }
        ]
      };

      // Update the form
      const response = await this.forms.forms.batchUpdate({
        formId: args.formId,
        requestBody: updateRequest,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Text question added successfully',
              questionTitle: args.questionTitle,
              required: args.required || false,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error adding text question:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to add text question: ${error.message}`
      );
    }
  }

  private async addMultipleChoiceQuestion(args: any) {
    if (!args.formId || !args.questionTitle || !args.options || !Array.isArray(args.options)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Form ID, question title, and options array are required'
      );
    }

    try {
      // Create choices
      const choices = args.options.map((option: string) => ({
        value: option
      }));

      // Create a request to add a new question
      const updateRequest = {
        requests: [
          {
            createItem: {
              item: {
                title: args.questionTitle,
                questionItem: {
                  question: {
                    required: args.required || false,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: choices,
                    }
                  }
                }
              },
              location: {
                index: 0
              }
            }
          }
        ]
      };

      // Update the form
      const response = await this.forms.forms.batchUpdate({
        formId: args.formId,
        requestBody: updateRequest,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Multiple choice question added successfully',
              questionTitle: args.questionTitle,
              options: args.options,
              required: args.required || false,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error adding multiple choice question:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to add multiple choice question: ${error.message}`
      );
    }
  }

  private async getForm(args: any) {
    if (!args.formId) {
      throw new McpError(ErrorCode.InvalidParams, 'Form ID is required');
    }

    try {
      const response = await this.forms.forms.get({
        formId: args.formId,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error getting form:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get form: ${error.message}`
      );
    }
  }

  private async getFormResponses(args: any) {
    if (!args.formId) {
      throw new McpError(ErrorCode.InvalidParams, 'Form ID is required');
    }

    try {
      const response = await this.forms.forms.responses.list({
        formId: args.formId,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error getting form responses:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get form responses: ${error.message}`
      );
    }
  }

  private async addCheckboxQuestion(args: any) {
    if (!args.formId || !args.questionTitle || !args.options || !Array.isArray(args.options)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Form ID, question title, and options array are required'
      );
    }

    try {
      const choices = args.options.map((option: string) => ({
        value: option
      }));

      const updateRequest = {
        requests: [
          {
            createItem: {
              item: {
                title: args.questionTitle,
                questionItem: {
                  question: {
                    required: args.required || false,
                    choiceQuestion: {
                      type: 'CHECKBOX',
                      options: choices,
                    }
                  }
                }
              },
              location: {
                index: 0
              }
            }
          }
        ]
      };

      await this.forms.forms.batchUpdate({
        formId: args.formId,
        requestBody: updateRequest,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Checkbox question added successfully',
              questionTitle: args.questionTitle,
              options: args.options,
              required: args.required || false,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error adding checkbox question:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to add checkbox question: ${error.message}`
      );
    }
  }

  private async addDropdownQuestion(args: any) {
    if (!args.formId || !args.questionTitle || !args.options || !Array.isArray(args.options)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Form ID, question title, and options array are required'
      );
    }

    try {
      const choices = args.options.map((option: string) => ({
        value: option
      }));

      const updateRequest = {
        requests: [
          {
            createItem: {
              item: {
                title: args.questionTitle,
                questionItem: {
                  question: {
                    required: args.required || false,
                    choiceQuestion: {
                      type: 'DROP_DOWN',
                      options: choices,
                    }
                  }
                }
              },
              location: {
                index: 0
              }
            }
          }
        ]
      };

      await this.forms.forms.batchUpdate({
        formId: args.formId,
        requestBody: updateRequest,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Dropdown question added successfully',
              questionTitle: args.questionTitle,
              options: args.options,
              required: args.required || false,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error adding dropdown question:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to add dropdown question: ${error.message}`
      );
    }
  }

  private async addScaleQuestion(args: any) {
    if (!args.formId || !args.questionTitle || args.low === undefined || args.high === undefined) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Form ID, question title, low, and high values are required'
      );
    }

    try {
      const scaleQuestion: any = {
        low: args.low,
        high: args.high,
      };

      if (args.lowLabel) {
        scaleQuestion.lowLabel = args.lowLabel;
      }
      if (args.highLabel) {
        scaleQuestion.highLabel = args.highLabel;
      }

      const updateRequest = {
        requests: [
          {
            createItem: {
              item: {
                title: args.questionTitle,
                questionItem: {
                  question: {
                    required: args.required || false,
                    scaleQuestion: scaleQuestion
                  }
                }
              },
              location: {
                index: 0
              }
            }
          }
        ]
      };

      await this.forms.forms.batchUpdate({
        formId: args.formId,
        requestBody: updateRequest,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Scale question added successfully',
              questionTitle: args.questionTitle,
              low: args.low,
              high: args.high,
              lowLabel: args.lowLabel || '',
              highLabel: args.highLabel || '',
              required: args.required || false,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error adding scale question:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to add scale question: ${error.message}`
      );
    }
  }

  private async addTextItem(args: any) {
    if (!args.formId || !args.title) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Form ID and title are required'
      );
    }

    try {
      const item: any = {
        title: args.title,
        textItem: {}
      };

      if (args.description) {
        item.description = args.description;
      }

      const updateRequest = {
        requests: [
          {
            createItem: {
              item: item,
              location: {
                index: 0
              }
            }
          }
        ]
      };

      await this.forms.forms.batchUpdate({
        formId: args.formId,
        requestBody: updateRequest,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Text item added successfully',
              title: args.title,
              description: args.description || '',
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error adding text item:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to add text item: ${error.message}`
      );
    }
  }

  private async addSection(args: any) {
    if (!args.formId || !args.title) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Form ID and title are required'
      );
    }

    try {
      const item: any = {
        title: args.title,
        pageBreakItem: {}
      };

      if (args.description) {
        item.description = args.description;
      }

      const updateRequest = {
        requests: [
          {
            createItem: {
              item: item,
              location: {
                index: 0
              }
            }
          }
        ]
      };

      await this.forms.forms.batchUpdate({
        formId: args.formId,
        requestBody: updateRequest,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Section added successfully',
              title: args.title,
              description: args.description || '',
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error adding section:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to add section: ${error.message}`
      );
    }
  }

  private async updateFormInfo(args: any) {
    if (!args.formId) {
      throw new McpError(ErrorCode.InvalidParams, 'Form ID is required');
    }

    if (!args.title && !args.description) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'At least one of title or description is required'
      );
    }

    try {
      const info: any = {};
      const updateMaskParts: string[] = [];

      if (args.title) {
        info.title = args.title;
        updateMaskParts.push('title');
      }
      if (args.description !== undefined) {
        info.description = args.description;
        updateMaskParts.push('description');
      }

      const updateRequest = {
        requests: [
          {
            updateFormInfo: {
              info: info,
              updateMask: updateMaskParts.join(',')
            }
          }
        ]
      };

      await this.forms.forms.batchUpdate({
        formId: args.formId,
        requestBody: updateRequest,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Form info updated successfully',
              title: args.title || '(unchanged)',
              description: args.description !== undefined ? args.description : '(unchanged)',
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error updating form info:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to update form info: ${error.message}`
      );
    }
  }

  private async deleteQuestion(args: any) {
    if (!args.formId || args.index === undefined) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Form ID and index are required'
      );
    }

    try {
      const updateRequest = {
        requests: [
          {
            deleteItem: {
              location: {
                index: args.index
              }
            }
          }
        ]
      };

      await this.forms.forms.batchUpdate({
        formId: args.formId,
        requestBody: updateRequest,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Question deleted successfully',
              deletedIndex: args.index,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error deleting question:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to delete question: ${error.message}`
      );
    }
  }

  private async updateQuestion(args: any) {
    if (!args.formId || args.index === undefined) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Form ID and index are required'
      );
    }

    if (args.questionTitle === undefined && args.description === undefined && args.required === undefined) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'At least one of questionTitle, description, or required must be provided'
      );
    }

    try {
      // First, get the form to retrieve the item at the specified index
      const formResponse = await this.forms.forms.get({
        formId: args.formId,
      });

      const items = formResponse.data.items;
      if (!items || args.index >= items.length) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid index: ${args.index}. Form has ${items ? items.length : 0} items.`
        );
      }

      const existingItem = items[args.index];
      const itemId = existingItem.itemId;

      // Build the update request
      const updateMaskParts: string[] = [];
      const item: any = {
        itemId: itemId
      };

      if (args.questionTitle !== undefined) {
        item.title = args.questionTitle;
        updateMaskParts.push('title');
      }

      if (args.description !== undefined) {
        item.description = args.description;
        updateMaskParts.push('description');
      }

      // For question items, we need to preserve the questionItem structure
      if (existingItem.questionItem) {
        const questionId = existingItem.questionItem.question.questionId;
        item.questionItem = {
          question: {
            questionId: questionId
          }
        };

        // Handle required field for question items
        if (args.required !== undefined) {
          item.questionItem.question.required = args.required;
          updateMaskParts.push('questionItem.question.required');
        }
      }

      const updateRequest = {
        requests: [
          {
            updateItem: {
              item: item,
              location: {
                index: args.index
              },
              updateMask: updateMaskParts.join(',')
            }
          }
        ]
      };

      await this.forms.forms.batchUpdate({
        formId: args.formId,
        requestBody: updateRequest,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Question updated successfully',
              index: args.index,
              questionTitle: args.questionTitle !== undefined ? args.questionTitle : '(unchanged)',
              description: args.description !== undefined ? args.description : '(unchanged)',
              required: args.required !== undefined ? args.required : '(unchanged)',
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error updating question:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to update question: ${error.message}`
      );
    }
  }

  private async moveQuestion(args: any) {
    if (!args.formId || args.fromIndex === undefined || args.toIndex === undefined) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Form ID, fromIndex, and toIndex are required'
      );
    }

    try {
      const updateRequest = {
        requests: [
          {
            moveItem: {
              originalLocation: {
                index: args.fromIndex
              },
              newLocation: {
                index: args.toIndex
              }
            }
          }
        ]
      };

      await this.forms.forms.batchUpdate({
        formId: args.formId,
        requestBody: updateRequest,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Question moved successfully',
              fromIndex: args.fromIndex,
              toIndex: args.toIndex,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error moving question:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to move question: ${error.message}`
      );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Google Forms MCP server running on stdio');
  }
}

const server = new GoogleFormsServer();
server.run().catch(console.error);
