[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/matteoantoci-google-forms-mcp-badge.png)](https://mseep.ai/app/matteoantoci-google-forms-mcp)

# Google Forms MCP Server

This MCP server uses the Google Forms API to provide functions such as creating, editing, and retrieving responses for forms.

## Build Method

### Initial Setup
After cloning the repository, install dependencies
```
cd google-forms-mcp
```

### Build the Server
```
# Build the main MCP server
npm run build
```

### Build the Refresh Token Acquisition Script
```
# Build the refresh token acquisition script
npm run build:token
```

### Execution in Development Environment
```
# Run the server directly
node build/index.js

# Or, use npm script
npm run start
```


## Setup Method

1. Create a project in Google Cloud Console and enable the Google Forms API.
   - https://console.cloud.google.com/
   - Search for "Google Forms API" from APIs & Services > Library and enable it.

2. Obtain OAuth 2.0 Client ID and Secret.
   - APIs & Services > Credentials > Create Credentials > OAuth client ID
   - Select Application type: "Desktop app"

3. Set environment variables and obtain the refresh token.
   ```bash
   export GOOGLE_CLIENT_ID="YOUR_CLIENT_ID"
   export GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
   cd google-forms-mcp
   npm run build
   node build/get-refresh-token.js
   ```

   Note: If an error occurs when running get-refresh-token.js, execute the following command:
   ```bash
   cd google-forms-mcp
   npm run build:token
   node build/get-refresh-token.js
   ```

4. Copy the displayed refresh token.

5. Update the Claude desktop app's configuration file.
   - Open `~/Library/Application Support/Claude/claude_desktop_config.json`.
   - Add environment variables to the `google-forms-mcp` in the `mcpServers` section:
   ```json
   "google-forms-mcp": {
     "command": "node",
     "args": [
       "/path/to/your/google-forms-mcp/build/index.js" # Update this path
     ],
     "env": {
       "GOOGLE_CLIENT_ID": "YOUR_CLIENT_ID",
       "GOOGLE_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
       "GOOGLE_REFRESH_TOKEN": "YOUR_REFRESH_TOKEN"
     }
   }
   ```

6. Restart the Claude desktop app.

### Claude Code Setup

To add this MCP server to Claude Code, run the following command (replace the placeholder values with your actual credentials):

```bash
claude mcp add-json google-forms-mcp "{\"command\":\"node\",\"args\":[\"<path-to-google-forms-mcp>/build/index.js\"],\"env\":{\"GOOGLE_CLIENT_ID\":\"<your-google-client-id>\",\"GOOGLE_CLIENT_SECRET\":\"<your-google-client-secret>\",\"GOOGLE_REFRESH_TOKEN\":\"<your-google-refresh-token>\"}}"
```

## Available Tools

This MCP server provides the following tools:

### Form Management
- `create_form` - Create a new Google Form
- `get_form` - Get form details
- `get_form_responses` - Get form responses
- `update_form_info` - Update form title and/or description

### Question Types
- `add_text_question` - Add a text (short answer) question
- `add_multiple_choice_question` - Add a multiple choice (radio) question
- `add_checkbox_question` - Add a checkbox (multi-select) question
- `add_dropdown_question` - Add a dropdown selection question
- `add_scale_question` - Add a linear scale question (e.g., 1-5 with labels)

### Form Content
- `add_text_item` - Add a static text/description block
- `add_section` - Add a section (page break) for better organization

### Question Management
- `update_question` - Update an existing question's title, description, or required status
- `delete_question` - Delete a question by its index
- `move_question` - Move a question to a new position in the form

## Usage Example

```
Create a customer feedback survey with sections, different question types, and a satisfaction scale.
```

Claude uses MCP tools like the following to create the form:

1. Use the `create_form` tool to create a new form
2. Use `update_form_info` to add a description
3. Use `add_text_item` to add a welcome message
4. Use `add_section` to organize the form into logical parts
5. Use various question tools (`add_text_question`, `add_multiple_choice_question`, `add_checkbox_question`, `add_dropdown_question`, `add_scale_question`) to add questions
6. Use `move_question` to reorder items as needed
7. Use `update_question` to modify questions if needed
8. Display the URL of the created form
