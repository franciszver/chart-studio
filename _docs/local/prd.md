Required first tasks (in order):
- Clone the repo and run it locally. Open it in your browser and explore the UI and make sure it comes up successfully with no errors.
- Explain aloud what the codebase does and what the purpose of the app is.
- Explain aloud how the data model of this app is designed.
- Explain aloud how a user's charts are persisted
- Make it possible to reorder the reporting dashboards at /dashboards and persist that ordering on page refresh

Tasks you can choose from, in any order:
- Put your own spin on the frontend styling and show us your sense of aesthetics and taste
- Implement line-wrapping in the SQL query viewer that can be turned on and off by pressing Option+Z or Alt+Z (the same key command as Vscode/Cursor for line wrapping)
- Make the table charts sortable in asc/desc order
- Make it possible to drag and reorder columns on the table charts and then persist that setting to the database
- Add a load spinner on page load for all pages; after loading is complete, fade in the page from zero opacity. include a sleep(2) so that the load spinner is always triggered to simulate a slow loading experience
- Test for security and fix the most critical issue
- Add an AI agent on the Data Explorer page that translates natural language queries into SQL commands and runs them
- Add a new chart type: scatter plot
- Make it possible to organize dashboards into collapsible folders with a drag-and-drop system