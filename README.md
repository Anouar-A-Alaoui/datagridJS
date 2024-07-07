# DataGrid Library

A customizable data grid library for displaying and managing large sets of data. Features include sorting, filtering, pagination, row selection, and exporting selected data to various formats such as CSV, JSON, XML, XLS, and XLSX without using external libraries.

## Features

- Display large sets of data with pagination
- Sorting and filtering on each column
- Row selection with "Select All" option
- Export selected rows to CSV, JSON, XML, XLS, and XLSX formats
- Column visibility toggling

## Installation

Clone the repository:

```sh
git clone https://github.com/Anouar-A-Alaoui/datagridJS.git
```

## Usage

Include the necessary JavaScript and CSS files in your project.
```sh
    datagrid.css
    datagrid.js
```

Create a new DataGrid instance by passing the selector for the container, your data array, and configuration options.

## Example

```javascript
// Sample data
const sampleData = [];
for (let i = 1; i <= 1000; i++) {
    sampleData.push({ id: i, name: `Person ${i}`, age: Math.floor(Math.random() * 100), city: `City ${i}` });
}

// Column configuration
const columns = [
    { key: 'select', label: 'Select', sortable: false, filterable: false },
    { key: 'name', label: 'Name', sortable: true, filterable: true },
    { key: 'age', label: 'Age', sortable: true, filterable: true },
    { key: 'city', label: 'City', sortable: true, filterable: true },
    { key: 'actions', label: 'Actions', sortable: false, filterable: false }
];

// Create a new DataGrid instance
const dataGrid = new DataGrid('#dataGridContainer', sampleData, {
    columns: columns,
    rowsPerPage: 10,
    selectAllPages: true
});
```

## Exporting Data

The DataGrid library supports exporting selected rows to various formats. Buttons for exporting to CSV, JSON, XML, XLS, and XLSX are automatically added to the grid container.
Export Classes

- CSVExporter: Exports data to CSV format.
- JSONExporter: Exports data to JSON format.
- XMLExporter: Exports data to XML format.
- XLSExporter: Exports data to XLS format.
- XLSXExporter: Exports data to XLSX format.

## Example Usage

To export the selected rows, simply click on the respective export button added to the grid container.
Configuration Options

    columns: Array of column configurations. Each column configuration should have the following properties:
        key: The key of the data object to be displayed in the column.
        label: The display name of the column.
        sortable: Boolean indicating if the column is sortable.
        filterable: Boolean indicating if the column is filterable.
    rowsPerPage: Number of rows to display per page.
    selectAllPages: Boolean indicating if the "Select All" option should select all rows across all pages or only the current page.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to discuss potential improvements.


## Current Features

### Display Large Sets of Data with Pagination:
 - Efficiently handles large datasets by paginating the data.
 - Supports changing the number of rows per page dynamically.

### Sorting and Filtering on Each Column:
 - Allows sorting data by any column.
 - Provides filtering options for each column, including "contains", "equal", "notContains", and "empty".

### Row Selection with "Select All" Option:
 - Supports individual row selection with checkboxes.
 - Includes a "Select All" checkbox to select or deselect all rows on the current page.

### Column Visibility Toggling:
 - Users can show or hide columns dynamically.
 - Preferences are saved locally and restored on page load.

### Row Reordering via Drag-and-Drop:
 - Allows users to reorder rows by dragging and dropping.
 - A drag handle (⠿) is provided for initiating row reordering.
 - Reordering updates both the original and filtered data arrays.

### Editing and Deleting Rows:
 - Provides inline editing and deletion options for each row.
 - Rows can be edited or deleted by clicking the respective action buttons.

### Exporting Selected Rows:
 - Supports exporting selected rows to various formats: CSV, JSON, XML, XLS, and XLSX.
 - Ensures that only visible and selected columns are exported.

### Importing Data:
 - Allows importing data from JSON, XML, CSV, XLS, and XLSX formats.
        Automatically updates the table with the imported data.

### Highlighting Selected Rows:
 - Provides visual feedback by highlighting selected rows.

### Maintaining Stripe Pattern for Rows:
 - Alternates the background color for odd and even rows for better readability.

## Potential Features

### Column Reordering:
 - Enable users to reorder columns via drag-and-drop.

### Resizable Columns:
 - Allow users to adjust the width of columns by dragging column borders.

### Advanced Filtering Options:
 - Add more filtering options like "greater than", "less than", and custom filter functions.

### Multi-level Sorting:
 - Allow sorting by multiple columns simultaneously.

### Search Across All Columns:
 - Provide a global search bar to filter data across all columns.

### Customizable Themes:
 - Add support for different themes and styles to customize the appearance of the grid.

### Inline Row Addition:
 - Allow users to add new rows directly from the grid interface.

### Server-side Pagination and Filtering:
 - Support server-side operations for better performance with extremely large datasets.

### Column Aggregation and Summarization:
 - Provide options to display aggregate data like sum, average, min, and max for numeric columns.

### Row Grouping and Subtotals:
 - Allow grouping rows by specific columns and display subtotals for each group.

### Drag-and-Drop File Upload:
 - Enable drag-and-drop file upload for importing data.

### Responsive Design:
 - Improve the grid's layout and behavior on different screen sizes and devices.

### Cell Editing:
 - Enable inline editing of individual cells rather than entire rows.

### Row and Column Freezing:
 - Allow freezing of specific rows or columns to keep them visible during scrolling.

### Column Summary Rows:
 - Add summary rows at the bottom or top of the table to display calculations like totals or averages.