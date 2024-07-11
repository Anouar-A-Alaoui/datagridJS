class DataGrid {
    constructor(selector, data, options) {
        this.container = document.querySelector(selector);
        this.data = this.generateUniqueIds(data);
        this.options = options;
        this.currentPage = 1;
        this.rowsPerPage = options.rowsPerPage || 10;
        this.filteredData = [...this.data];
        this.sortOrder = { column: '', order: '' };
        this.columns = options.columns.map(col => ({ ...col, visible: true }));
        this.selectedRows = new Set();
        this.selectAllPages = options.selectAllPages || false;
        this.showImportButton = options.showImportButton || false;
        this.enableDragAndDrop = options.enableDragAndDrop || false;
        this.enableColumnResizing = options.enableColumnResizing || false;

        this.init();
    }

    generateUniqueIds(data) {
        return data.map((item, index) => ({ ...item, id: `id_${index}_${Date.now()}` }));
    }

    init() {
        this.loadColumnPreferences();
        this.renderControls();
        this.renderTable();
        this.populateDataGrid(this.paginate(this.filteredData, this.currentPage, this.rowsPerPage));
        this.displayPage();
        this.addEventListeners();
        this.addExportButtons();
        if (this.options.showImportButton) {
            this.addImportButtons();
        }
    }

    renderControls() {
        const controlsHTML = `
            <div class="column-select">
                ${this.columns.map(col => `
                    <label><input type="checkbox" id="col${this.capitalizeFirstLetter(col.key)}" ${col.visible ? 'checked' : ''}> ${col.label}</label>
                `).join('')}
            </div>
            <div class="rows-per-page">
                <label for="rowsPerPage">Rows per page: </label>
                <select id="rowsPerPage">
                    <option value="5">5</option>
                    <option value="10" selected>10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                </select>
            </div>
        `;
        this.container.innerHTML = controlsHTML;
    }

    renderTable() {
        const tableHTML = `
            <table id="dataGrid">
                <thead>
                    <tr>
                        ${this.columns.map(col => this.renderHeader(col)).join('')}
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div class="pagination">
                <button id="firstPageBtn">First</button>
                <button id="prevPageBtn">Prev</button>
                <span id="pageInfo"></span>
                <button id="nextPageBtn">Next</button>
                <button id="lastPageBtn">Last</button>
            </div>
            <button id="testRowSelectionBtn">Get selected rows</button>
        `;
        this.container.innerHTML += tableHTML;
    }

    renderHeader(column) {
        return `
            <th id="header${this.capitalizeFirstLetter(column.key)}">
                <div>
                    ${column.label}
                    ${column.sortable ? `
                        <button class="sort-btn" data-key="${column.key}">Sort</button>
                    ` : ''}
                    ${column.filterable ? `
                        <select id="filter${this.capitalizeFirstLetter(column.key)}">
                            <option value="contains">Contains</option>
                            <option value="equal">Equal</option>
                            <option value="notContains">Does Not Contain</option>
                            <option value="empty">Is Empty</option>
                        </select>
                        <input type="text" id="search${this.capitalizeFirstLetter(column.key)}">
                    ` : ''}
                </div>
            </th>
        `;
    }

    addEventListeners() {
        document.getElementById('rowsPerPage').addEventListener('change', () => this.changeRowsPerPage());
        document.getElementById('firstPageBtn').addEventListener('click', () => this.firstPage());
        document.getElementById('prevPageBtn').addEventListener('click', () => this.prevPage());
        document.getElementById('nextPageBtn').addEventListener('click', () => this.nextPage());
        document.getElementById('lastPageBtn').addEventListener('click', () => this.lastPage());
        document.getElementById('testRowSelectionBtn').addEventListener('click', () => this.testRowSelection());

        this.columns.forEach(col => {
            if (col.filterable) {
                document.getElementById(`filter${this.capitalizeFirstLetter(col.key)}`).addEventListener('change', () => this.filterData());
                document.getElementById(`search${this.capitalizeFirstLetter(col.key)}`).addEventListener('input', () => this.filterData());
            }
            document.getElementById(`col${this.capitalizeFirstLetter(col.key)}`).addEventListener('change', () => this.toggleColumn(col.key));
        });

        document.querySelectorAll('.sort-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const columnKey = event.target.getAttribute('data-key');
                this.sortTable(columnKey);
            });
        });

        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.addEventListener('change', (event) => this.selectAllRows(event.target));
        const headerSelect = document.getElementById('headerSelect');
        if (headerSelect) {
            headerSelect.prepend(selectAllCheckbox);
        }

        if (this.enableDragAndDrop) {
            this.addDragAndDropListeners();
        }

        if (this.enableColumnResizing) {
            this.addColumnResizeListeners();
        }
    }

    saveColumnPreferences() {
        const columnsState = this.columns.map(col => ({ key: col.key, visible: col.visible }));
        localStorage.setItem('columns', JSON.stringify(columnsState));
    }

    loadColumnPreferences() {
        const savedColumns = localStorage.getItem('columns');
        if (savedColumns) {
            const savedColumnsArray = JSON.parse(savedColumns);
            this.columns.forEach(column => {
                const savedColumn = savedColumnsArray.find(col => col.key === column.key);
                if (savedColumn) {
                    column.visible = savedColumn.visible;
                }
            });
        }
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    toggleColumn(columnKey) {
        const column = this.columns.find(col => col.key === columnKey);
        column.visible = !column.visible;
        this.toggleColumnDisplay(columnKey, column.visible);
        this.saveColumnPreferences();
    }

    toggleColumnDisplay(columnKey, show) {
        const colHeader = document.getElementById(`header${this.capitalizeFirstLetter(columnKey)}`);
        if (colHeader) colHeader.style.display = show ? '' : 'none';
        const cells = document.querySelectorAll(`td[data-column="${columnKey}"], th[data-column="${columnKey}"]`);
        cells.forEach(cell => cell.style.display = show ? '' : 'none');
        this.updateColumnIndices();
    }

    updateColumnIndices() {
        const headers = document.querySelectorAll('#dataGrid th');
        headers.forEach((header, index) => {
            header.dataset.index = index;
        });
        const rows = document.querySelectorAll('#dataGrid tbody tr');
        rows.forEach(row => {
            row.querySelectorAll('td').forEach((cell, index) => {
                cell.dataset.index = index;
            });
        });
    }
    
    paginate(data, page, rowsPerPage) {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return data.slice(start, end);
    }

    addDragAndDropListeners() {
        const handles = document.querySelectorAll('.drag-handle');
        handles.forEach(handle => {
            handle.addEventListener('dragstart', this.handleDragStart.bind(this));
        });
    
        const rows = document.querySelectorAll('#dataGrid tbody tr');
        rows.forEach(row => {
            row.addEventListener('dragover', this.handleDragOver.bind(this));
            row.addEventListener('drop', this.handleDrop.bind(this));
            row.addEventListener('dragleave', this.handleDragLeave.bind(this));
        });
    }
    
    handleDragStart(event) {
        const row = event.target.closest('tr');
        event.dataTransfer.setData('text/plain', row.dataset.id);
        this.draggedRow = row;
        setTimeout(() => row.classList.add('dragging'), 0); // Apply a delay to allow the drag to start
    }
    
    handleDragOver(event) {
        event.preventDefault();
        const targetRow = event.target.closest('tr');
        if (targetRow && targetRow !== this.draggedRow) {
            targetRow.classList.add('drag-over');
        }
    }
    
    handleDrop(event) {
        event.preventDefault();
        const targetRow = event.target.closest('tr');
        const draggedRowId = event.dataTransfer.getData('text/plain');
        if (!targetRow || draggedRowId === targetRow.dataset.id) return;
    
        this.draggedRow.classList.remove('dragging');
        targetRow.classList.remove('drag-over');
    
        const draggedRowIndex = this.data.findIndex(item => item.id === draggedRowId);
        const targetRowIndex = this.data.findIndex(item => item.id === targetRow.dataset.id);
    
        if (draggedRowIndex !== -1 && targetRowIndex !== -1) {
            const [draggedRowData] = this.data.splice(draggedRowIndex, 1);
            this.data.splice(targetRowIndex, 0, draggedRowData);
            this.filteredData = [...this.data]; // Update filteredData to reflect changes
            this.displayPage();
        }
    }
    
    
    handleDragLeave(event) {
        const targetRow = event.target.closest('tr');
        if (targetRow) {
            targetRow.classList.remove('drag-over');
        }
    }
    

    addRowClickListeners() {
        const rows = document.querySelectorAll('#dataGrid tbody tr');
        rows.forEach(row => {
            row.addEventListener('click', (event) => {
                if (event.ctrlKey || event.target.type === 'checkbox') {
                    this.toggleRowSelection(row.dataset.id);
                }
            });
        });
    }
    
    toggleRowSelection(id) {
        if (this.selectedRows.has(id)) {
            this.selectedRows.delete(id);
        } else {
            this.selectedRows.add(id);
        }
        this.highlightSelectedRows();
    }
    
    highlightSelectedRows() {
        const rows = document.querySelectorAll('#dataGrid tbody tr');
        rows.forEach(row => {
            if (this.selectedRows.has(row.dataset.id)) {
                row.classList.add('selected-row');
            } else {
                row.classList.remove('selected-row');
            }
        });
    }
    
    
    updateColumnWidth(columnIndex, width) {
        const headers = document.querySelectorAll('#dataGrid th');
        if (headers[columnIndex]) {
            headers[columnIndex].style.width = `${width}px`;
        }
        const rows = document.querySelectorAll('#dataGrid tbody tr');
        rows.forEach(row => {
            row.children[columnIndex].style.width = `${width}px`;
        });
    }
    

    addColumnResizeListeners() {
        const headers = document.querySelectorAll('#dataGrid th');
        headers.forEach((header) => {
            const resizer = document.createElement('div');
            resizer.classList.add('resizer');
            header.style.position = 'relative';  // Ensure header is positioned relative for the resizer
            header.appendChild(resizer);
            resizer.addEventListener('mousedown', this.initResize.bind(this, header));
        });
    
        const cells = document.querySelectorAll('#dataGrid td');
        cells.forEach((cell) => {
            const resizer = document.createElement('div');
            resizer.classList.add('resizer');
            cell.style.position = 'relative';  // Ensure cell is positioned relative for the resizer
            cell.appendChild(resizer);
            resizer.addEventListener('mousedown', this.initResize.bind(this, cell));
        });
    }
    

    initResize(element, event) {
        this.startX = event.pageX;
        this.startWidth = element.offsetWidth;
        this.resizingColumnIndex = parseInt(element.dataset.index, 10);
        document.documentElement.addEventListener('mousemove', this.doResize);
        document.documentElement.addEventListener('mouseup', this.stopResize);
        this.applyResizingClass(true);
    }   
    
    applyResizingClass(apply) {
        const elements = document.querySelectorAll(`#dataGrid th:nth-child(${this.resizingColumnIndex + 1}), #dataGrid td:nth-child(${this.resizingColumnIndex + 1})`);
        elements.forEach(element => {
            if (apply) {
                element.classList.add('resizing');
            } else {
                element.classList.remove('resizing');
            }
        });
    } 
    
    

    doResize = (event) => {
        const width = this.startWidth + (event.pageX - this.startX);
        this.updateColumnWidth(this.resizingColumnIndex, width);
    }
    
    
    

    stopResize = () => {
        document.documentElement.removeEventListener('mousemove', this.doResize);
        document.documentElement.removeEventListener('mouseup', this.stopResize);
        this.applyResizingClass(false);
    }
    
    
    

    renderTable() {
        const tableHTML = `
            <table id="dataGrid">
                <thead>
                    <tr>
                        ${this.enableDragAndDrop ? '<th></th>' : ''}
                        ${this.columns.map(col => this.renderHeader(col)).join('')}
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div class="pagination">
                <button id="firstPageBtn">First</button>
                <button id="prevPageBtn">Prev</button>
                <span id="pageInfo"></span>
                <button id="nextPageBtn">Next</button>
                <button id="lastPageBtn">Last</button>
            </div>
            <button id="testRowSelectionBtn">Get selected rows</button>
        `;
        this.container.innerHTML += tableHTML;
    }


    populateDataGrid(data) {
        const tbody = document.querySelector('#dataGrid tbody');
        tbody.innerHTML = ''; // Clear any existing rows
    
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', item.id);
            if (index % 2 === 0) {
                row.classList.add('even-row');
            } else {
                row.classList.add('odd-row');
            }
    
            if (this.enableDragAndDrop) {
                const handleCell = document.createElement('td');
                handleCell.innerHTML = '<span class="drag-handle" draggable="true">⠿</span>';
                handleCell.style.position = 'relative'; // Ensure position relative for drag handle
                row.appendChild(handleCell);
            }
    
            this.columns.forEach((col, colIndex) => {
                if (col.key === 'select') {
                    const selectCell = document.createElement('td');
                    selectCell.setAttribute('data-column', 'select');
                    selectCell.style.display = col.visible ? '' : 'none';
                    selectCell.style.position = 'relative'; // Ensure position relative for resizer
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = this.selectedRows.has(item.id);
                    checkbox.onclick = (e) => {
                        e.stopPropagation();
                        this.toggleRowSelection(item.id);
                    };
                    selectCell.appendChild(checkbox);
                    row.appendChild(selectCell);
                } else if (col.key === 'actions') {
                    const actionsCell = document.createElement('td');
                    actionsCell.setAttribute('data-column', 'actions');
                    actionsCell.style.position = 'relative'; // Ensure position relative for resizer
                    actionsCell.innerHTML = `
                        <span class="action-btn" data-id="${item.id}" data-action="edit">Edit</span> |
                        <span class="action-btn" data-id="${item.id}" data-action="delete">Delete</span>
                    `;
                    actionsCell.style.display = col.visible ? '' : 'none';
                    row.appendChild(actionsCell);
                } else {
                    const cell = document.createElement('td');
                    cell.textContent = item[col.key] || '';
                    cell.setAttribute('data-column', col.key);
                    cell.setAttribute('data-index', colIndex);
                    cell.style.display = col.visible ? '' : 'none';
                    cell.style.position = 'relative'; // Ensure position relative for resizer
                    row.appendChild(cell);
                }
            });
    
            tbody.appendChild(row);
        });
    
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const action = event.target.getAttribute('data-action');
                const id = event.target.getAttribute('data-id');
                if (action === 'edit') {
                    this.editRow(id);
                } else if (action === 'delete') {
                    this.deleteRow(id);
                }
            });
        });
    
        // Uncheck "select all" if all rows are not selected
        const selectAllCheckbox = document.querySelector('#headerSelect input[type="checkbox"]');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = this.selectAllPages
                ? this.selectedRows.size === this.filteredData.length
                : this.paginate(this.filteredData, this.currentPage, this.rowsPerPage).every(item => this.selectedRows.has(item.id));
        }
    
        if (this.enableDragAndDrop) {
            this.addDragAndDropListeners();
        }
    
        this.addRowClickListeners();
        this.highlightSelectedRows();
        this.addColumnResizeListeners(); // Ensure resizing listeners are re-added
    }
    
    

    filterData(resetPage = true) {
        const filters = {};
        this.columns.forEach(col => {
            if (col.filterable) {
                const searchValue = document.getElementById(`search${this.capitalizeFirstLetter(col.key)}`).value.toLowerCase();
                const filterType = document.getElementById(`filter${this.capitalizeFirstLetter(col.key)}`).value;
                filters[col.key] = { searchValue, filterType };
            }
        });

        this.filteredData = this.data.filter(item => {
            return Object.keys(filters).every(key => {
                const filter = filters[key];
                return this.applyFilter(item[key]?.toString().toLowerCase() || '', filter.searchValue, filter.filterType);
            });
        });

        if (resetPage) {
            this.currentPage = 1;
        }
        this.displayPage();
    }

    toggleRowSelection(id) {
        const row = this.data.find(item => item.id === id);
        if (this.selectedRows.has(id)) {
            this.selectedRows.delete(id);
        } else {
            this.selectedRows.add(id);
        }
        this.displayPage();
    }

    updatePagination() {
        const pageInfo = document.getElementById('pageInfo');
        const totalPages = Math.ceil(this.filteredData.length / this.rowsPerPage);
        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredData.length / this.rowsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.displayPage();
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displayPage();
        }
    }

    firstPage() {
        this.currentPage = 1;
        this.displayPage();
    }

    lastPage() {
        this.currentPage = Math.ceil(this.filteredData.length / this.rowsPerPage);
        this.displayPage();
    }

    displayPage() {
        const paginatedData = this.paginate(this.filteredData, this.currentPage, this.rowsPerPage);
        this.populateDataGrid(paginatedData);
        this.updatePagination();
    }

    sortTable(columnKey) {
        const order = this.sortOrder.column === columnKey && this.sortOrder.order === 'asc' ? 'desc' : 'asc';
        this.sortOrder = { column: columnKey, order };

        this.filteredData.sort((a, b) => {
            if (a[columnKey] > b[columnKey]) return order === 'asc' ? 1 : -1;
            if (a[columnKey] < b[columnKey]) return order === 'asc' ? -1 : 1;
            return 0;
        });

        this.displayPage();
    }

    applyFilter(value, searchValue, filterType) {
        switch (filterType) {
            case 'contains':
                return value.includes(searchValue);
            case 'equal':
                return value === searchValue;
            case 'notContains':
                return !value.includes(searchValue);
            case 'empty':
                return value === '';
            default:
                return true;
        }
    }

    editRow(id) {
        const row = this.filteredData.find(item => item.id === id);
        this.columns.forEach(col => {
            if (col.key !== 'select' && col.key !== 'actions') {
                const newValue = prompt(`Enter new ${col.label}:`, row[col.key] || '');
                if (newValue !== null) row[col.key] = newValue;
            }
        });
        this.displayPage();
    }

    deleteRow(id) {
        this.filteredData = this.filteredData.filter(item => item.id !== id);
        this.selectedRows.delete(id);
        this.displayPage();
    }

    toggleRowSelection(id) {
        if (this.selectedRows.has(id)) {
            this.selectedRows.delete(id);
        } else {
            this.selectedRows.add(id);
        }
        this.displayPage();
    }

    selectAllRows(source) {
        const paginatedData = this.paginate(this.filteredData, this.currentPage, this.rowsPerPage);
        if (source.checked) {
            if (this.selectAllPages) {
                this.filteredData.forEach(item => this.selectedRows.add(item.id));
            } else {
                paginatedData.forEach(item => this.selectedRows.add(item.id));
            }
        } else {
            if (this.selectAllPages) {
                this.filteredData.forEach(item => this.selectedRows.delete(item.id));
            } else {
                paginatedData.forEach(item => this.selectedRows.delete(item.id));
            }
        }
        this.displayPage();
    }

    changeRowsPerPage() {
        this.rowsPerPage = parseInt(document.getElementById('rowsPerPage').value, 10);
        this.currentPage = 1;
        this.displayPage();
    }

    testRowSelection() {
        alert('Selected rows: ' + Array.from(this.selectedRows).join(', '));
    }

    addExportButtons() {
        const exportCSVButton = document.createElement('button');
        exportCSVButton.textContent = 'Export Selected to CSV';
        exportCSVButton.addEventListener('click', () => this.exportSelectedToCSV());
        this.container.appendChild(exportCSVButton);

        const exportJSONButton = document.createElement('button');
        exportJSONButton.textContent = 'Export Selected to JSON';
        exportJSONButton.addEventListener('click', () => this.exportSelectedToJSON());
        this.container.appendChild(exportJSONButton);

        const exportXMLButton = document.createElement('button');
        exportXMLButton.textContent = 'Export Selected to XML';
        exportXMLButton.addEventListener('click', () => this.exportSelectedToXML());
        this.container.appendChild(exportXMLButton);

        const exportXLSButton = document.createElement('button');
        exportXLSButton.textContent = 'Export Selected to XLS';
        exportXLSButton.addEventListener('click', () => this.exportSelectedToXLS());
        this.container.appendChild(exportXLSButton);

        const exportXLSXButton = document.createElement('button');
        exportXLSXButton.textContent = 'Export Selected to XLSX';
        exportXLSXButton.addEventListener('click', () => this.exportSelectedToXLSX());
        this.container.appendChild(exportXLSXButton);
    }

    exportSelectedToCSV() {
        const selectedData = this.data.filter(item => this.selectedRows.has(item.id));
        const exportColumns = this.columns.filter(col => col.key !== 'select' && col.key !== 'actions' && col.key !== 'id' && col.visible);
        CSVExporter.export(selectedData, exportColumns);
    }

    exportSelectedToJSON() {
        const selectedData = this.data.filter(item => this.selectedRows.has(item.id));
        const exportColumns = this.columns.filter(col => col.key !== 'select' && col.key !== 'actions' && col.key !== 'id' && col.visible);
        JSONExporter.export(selectedData, exportColumns);
    }

    exportSelectedToXML() {
        const selectedData = this.data.filter(item => this.selectedRows.has(item.id));
        const exportColumns = this.columns.filter(col => col.key !== 'select' && col.key !== 'actions' && col.key !== 'id' && col.visible);
        XMLExporter.export(selectedData, exportColumns);
    }

    exportSelectedToXLS() {
        const selectedData = this.data.filter(item => this.selectedRows.has(item.id));
        const exportColumns = this.columns.filter(col => col.key !== 'select' && col.key !== 'actions' && col.key !== 'id' && col.visible);
        XLSExporter.export(selectedData, exportColumns);
    }

    exportSelectedToXLSX() {
        const selectedData = this.data.filter(item => this.selectedRows.has(item.id));
        const exportColumns = this.columns.filter(col => col.key !== 'select' && col.key !== 'actions' && col.key !== 'id' && col.visible);
        XLSXExporter.export(selectedData, exportColumns);
    }

    addImportButtons() {
        const importJSONButton = document.createElement('button');
        importJSONButton.textContent = 'Import JSON';
        importJSONButton.addEventListener('click', () => this.importJSON());
        this.container.appendChild(importJSONButton);

        const importXMLButton = document.createElement('button');
        importXMLButton.textContent = 'Import XML';
        importXMLButton.addEventListener('click', () => this.importXML());
        this.container.appendChild(importXMLButton);

        const importCSVButton = document.createElement('button');
        importCSVButton.textContent = 'Import CSV';
        importCSVButton.addEventListener('click', () => this.importCSV());
        this.container.appendChild(importCSVButton);

        const importXLSButton = document.createElement('button');
        importXLSButton.textContent = 'Import XLS';
        importXLSButton.addEventListener('click', () => this.importXLS());
        this.container.appendChild(importXLSButton);

        const importXLSXButton = document.createElement('button');
        importXLSXButton.textContent = 'Import XLSX';
        importXLSXButton.addEventListener('click', () => this.importXLSX());
        this.container.appendChild(importXLSXButton);
    }

    importJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.addEventListener('change', (event) => this.handleFileSelect(event, 'json'));
        input.click();
    }

    importXML() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/xml';
        input.addEventListener('change', (event) => this.handleFileSelect(event, 'xml'));
        input.click();
    }

    importCSV() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.addEventListener('change', (event) => this.handleFileSelect(event, 'csv'));
        input.click();
    }

    importXLS() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xls';
        input.addEventListener('change', (event) => this.handleFileSelect(event, 'xls'));
        input.click();
    }

    importXLSX() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx';
        input.addEventListener('change', (event) => this.handleFileSelect(event, 'xlsx'));
        input.click();
    }

    handleFileSelect(event, fileType) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                let importedData;
                switch (fileType) {
                    case 'json':
                        importedData = JSON.parse(e.target.result);
                        break;
                    case 'xml':
                        importedData = this.parseXML(e.target.result);
                        break;
                    case 'csv':
                        importedData = this.parseCSV(e.target.result);
                        break;
                    case 'xls':
                        importedData = this.parseXLS(e.target.result);
                        break;
                    case 'xlsx':
                        importedData = this.parseXLSX(e.target.result);
                        break;
                }
                this.updateTable(importedData);
            };
            reader.readAsText(file);
        }
    }

    updateTable(importedData) {
        this.data = this.generateUniqueIds(importedData);
        this.filteredData = [...this.data];
        this.columns = [
            { key: 'select', label: 'Select', sortable: false, filterable: false, visible: true },
            ...Object.keys(importedData[0] || {}).map(key => ({ key, label: this.capitalizeFirstLetter(key), sortable: true, filterable: true, visible: true })).filter(col => col.key !== 'id'),
            { key: 'actions', label: 'Actions', sortable: false, filterable: false, visible: true }
        ];
        this.init();
    }

    parseXML(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        const rows = Array.from(xmlDoc.getElementsByTagName('row'));
        return rows.map((row, index) => {
            const obj = { id: `id_${index}_${Date.now()}` };
            Array.from(row.children).forEach(cell => {
                obj[cell.tagName.toLowerCase()] = cell.textContent;
            });
            return obj;
        });
    }

    parseCSV(csvString) {
        const lines = csvString.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(header => header.trim());
        return lines.slice(1).map((line, index) => {
            const cells = line.split(',').map(cell => cell.trim());
            const obj = { id: `id_${index}_${Date.now()}` };
            headers.forEach((header, idx) => {
                obj[header] = cells[idx];
            });
            return obj;
        });
    }

    parseXLS(xlsString) {
        const rows = xlsString.split('\n').map(row => row.split('\t'));
        const headers = rows[0];
        return rows.slice(1).map((row, index) => {
            const obj = { id: `id_${index}_${Date.now()}` };
            row.forEach((cell, i) => {
                obj[headers[i]] = cell;
            });
            return obj;
        });
    }

    parseXLSX(xlsxString) {
        const rows = xlsxString.split('\n').map(row => row.split('\t'));
        const headers = rows[0];
        return rows.slice(1).map((row, index) => {
            const obj = { id: `id_${index}_${Date.now()}` };
            row.forEach((cell, i) => {
                obj[headers[i]] = cell;
            });
            return obj;
        });
    }
}

class CSVExporter {
    static export(data, columns, filename = 'data.csv') {
        const csvContent = CSVExporter.generateCSVContent(data, columns);
        CSVExporter.downloadCSV(csvContent, filename);
    }

    static generateCSVContent(data, columns) {
        const header = columns.map(col => col.label).join(',');
        const rows = data.map(row => 
            columns.map(col => `"${row[col.key]}"`).join(',')
        );
        return [header, ...rows].join('\n');
    }

    static downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

class JSONExporter {
    static export(data, filename = 'data.json') {
        const jsonContent = JSON.stringify(data, null, 2);
        JSONExporter.downloadJSON(jsonContent, filename);
    }

    static downloadJSON(content, filename) {
        const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

class XMLExporter {
    static export(data, columns, filename = 'data.xml') {
        const xmlContent = XMLExporter.generateXMLContent(data, columns);
        XMLExporter.downloadXML(xmlContent, filename);
    }

    static generateXMLContent(data, columns) {
        const header = `<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n`;
        const rows = data.map(row => 
            `<row>\n${columns.map(col => `<${col.key}>${row[col.key]}</${col.key}>`).join('\n')}\n</row>`
        ).join('\n');
        return `${header}${rows}\n</rows>`;
    }

    static downloadXML(content, filename) {
        const blob = new Blob([content], { type: 'application/xml;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

class XLSExporter {
    static export(data, columns, filename = 'data.xls') {
        const xlsContent = XLSExporter.generateXLSContent(data, columns);
        XLSExporter.downloadXLS(xlsContent, filename);
    }

    static generateXLSContent(data, columns) {
        const header = columns.map(col => col.label).join('\t');
        const rows = data.map(row => 
            columns.map(col => row[col.key]).join('\t')
        ).join('\n');
        return `${header}\n${rows}`;
    }

    static downloadXLS(content, filename) {
        const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

class XLSXExporter {
    static export(data, columns, filename = 'data.xlsx') {
        const xlsxContent = XLSXExporter.generateXLSXContent(data, columns);
        XLSXExporter.downloadXLSX(xlsxContent, filename);
    }

    static generateXLSXContent(data, columns) {
        const header = columns.map(col => col.label).join('\t');
        const rows = data.map(row => 
            columns.map(col => row[col.key]).join('\t')
        ).join('\n');
        return `${header}\n${rows}`;
    }

    static downloadXLSX(content, filename) {
        const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}
