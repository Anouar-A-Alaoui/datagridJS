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