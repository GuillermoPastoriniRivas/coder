import React, { useState, useEffect, useMemo } from 'react';
import {
    Container, Box, Typography, Paper, CircularProgress, Alert,
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Tooltip, TableSortLabel, TablePagination,
    ToggleButtonGroup, ToggleButton
} from '@mui/material';
import api from '../api';

// Helper function to format numbers
const formatNumber = (num, decimals = 0) => num?.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) || 'N/A';
const formatCurrency = (num) => num?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || 'N/A'; // Allow more decimals for small costs
const formatTimestamp = (timestamp) => timestamp ? new Date(timestamp).toLocaleString() : 'N/A'; // For detailed view
const formatDate = (timestamp) => timestamp ? new Date(timestamp).toLocaleDateString() : 'N/A'; // For aggregated view

export default function CallHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('aggregated'); // 'aggregated' or 'detailed'

    // Sorting state (adapts based on viewMode)
    const [orderBy, setOrderBy] = useState(viewMode === 'aggregated' ? 'date' : 'timestamp');
    const [order, setOrder] = useState('desc');

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchCallHistory();
    }, []);

    // Reset sorting/pagination when view mode changes
    useEffect(() => {
        setOrderBy(viewMode === 'aggregated' ? 'date' : 'timestamp');
        setOrder('desc');
        setPage(0);
        setRowsPerPage(10);
    }, [viewMode]);

    const fetchCallHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.getCallHistory();
            setHistory(response.data || []);
        } catch (err) {
            console.error('Error fetching call history:', err);
            setError(err.response?.data?.message || 'Failed to load call history.');
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Aggregated Data Logic ---
    const aggregatedData = useMemo(() => {
        if (!history || history.length === 0) return [];

        const grouped = history.reduce((acc, call) => {
            const date = formatDate(call.timestamp);
            const projectName = call.project_name?.replaceAll('\\', '/').split('/').pop() || 'Unknown Project';
            const key = `${date}::${projectName}`;

            if (!acc[key]) {
                acc[key] = {
                    date: new Date(call.timestamp), // Store Date object for accurate sorting
                    displayDate: date,
                    projectName: projectName,
                    totalCost: 0,
                };
            }
            acc[key].totalCost += call.total_cost || 0;

            return acc;
        }, {});

        return Object.values(grouped);
    }, [history]);

    // --- Sorting Logic (Combined) ---
    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const descendingComparator = (a, b, orderByField) => {
        let valA = a[orderByField];
        let valB = b[orderByField];

        // Handle specific types based on viewMode and field
        if (orderByField === 'timestamp') { // Detailed view
            valA = new Date(valA);
            valB = new Date(valB);
        } else if (orderByField === 'date') { // Aggregated view
            valA = a.date; // Use the actual Date object
            valB = b.date;
        } else if (orderByField === 'projectName') { // Aggregated view (case-insensitive)
             valA = (valA || '').toLowerCase();
             valB = (valB || '').toLowerCase();
        }

        // Handle potential null/undefined for numeric or date comparisons
        valA = valA ?? (typeof valB === 'number' || valB instanceof Date ? -Infinity : '');
        valB = valB ?? (typeof valA === 'number' || valA instanceof Date ? -Infinity : '');

        if (valB < valA) return -1;
        if (valB > valA) return 1;
        return 0;
    };

    const getComparator = (currentOrder, currentOrderBy) => {
        return currentOrder === 'desc'
            ? (a, b) => descendingComparator(a, b, currentOrderBy)
            : (a, b) => -descendingComparator(a, b, currentOrderBy);
    };

    const stableSort = (array, comparator) => {
        const stabilizedThis = array.map((el, index) => [el, index]);
        stabilizedThis.sort((a, b) => {
            const orderResult = comparator(a[0], b[0]);
            if (orderResult !== 0) return orderResult;
            return a[1] - b[1];
        });
        return stabilizedThis.map((el) => el[0]);
    };

    // Determine data source and apply sorting
    const dataToDisplay = viewMode === 'detailed' ? history : aggregatedData;
    const sortedData = stableSort(dataToDisplay, getComparator(order, orderBy));

    // --- Pagination Logic ---
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Calculate visible rows for the current page
    const visibleRows = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // --- Column Definitions ---
    const aggregatedColumns = [
        { id: 'date', label: 'Date', minWidth: 150, numeric: false, format: (value) => value }, // Display pre-formatted date from displayDate
        { id: 'projectName', label: 'Project', minWidth: 200, numeric: false },
        { id: 'totalCost', label: 'Total Cost ($)', minWidth: 100, numeric: true, format: (value) => formatCurrency(value) },
    ];

    const detailedColumns = [
        { id: 'timestamp', label: 'Timestamp', minWidth: 170, numeric: false, format: formatTimestamp },
        { id: 'project_name', label: 'Project', minWidth: 150, numeric: false, format: (value) => value?.replaceAll('\\', '/').split('/').pop() || 'N/A' },
        { id: 'input_tokens', label: 'Tokens In', minWidth: 100, numeric: true, format: (value) => formatNumber(value) },
        { id: 'output_tokens', label: 'Tokens Out', minWidth: 100, numeric: true, format: (value) => formatNumber(value) },
        { id: 'delay', label: 'Duration (s)', minWidth: 100, numeric: true, format: (value) => value !== null && value !== undefined ? `${formatNumber(value, 2)} s` : 'N/A' },
        { id: 'total_cost', label: 'Cost ($)', minWidth: 100, numeric: true, format: (value) => formatCurrency(value) },
        { id: 'model', label: 'Model', minWidth: 150, numeric: false },
    ];

    const columns = viewMode === 'detailed' ? detailedColumns : aggregatedColumns;

    // --- View Mode Change Handler ---
    const handleViewChange = (event, newViewMode) => {
        if (newViewMode !== null) { // Prevent deselecting all toggles
          setViewMode(newViewMode);
        }
    };


    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h1">
                        AI Call History
                    </Typography>
                    <ToggleButtonGroup
                        color="primary"
                        value={viewMode}
                        exclusive
                        onChange={handleViewChange}
                        aria-label="View mode"
                        size="small"
                    >
                        <ToggleButton value="aggregated">Aggregated</ToggleButton>
                        <ToggleButton value="detailed">Detailed</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && !loading && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {!loading && !error && dataToDisplay.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        {viewMode === 'aggregated' ? 'No call history found to generate summary.' : 'No call history found.'}
                    </Typography>
                )}

                {!loading && !error && dataToDisplay.length > 0 && (
                    <>
                        <TableContainer sx={{ maxHeight: 600 }}> {/* Limit height and enable scroll */}
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        {columns.map((column) => (
                                            <TableCell
                                                key={column.id}
                                                align={column.numeric ? 'right' : 'left'}
                                                sortDirection={orderBy === column.id ? order : false}
                                                sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                            >
                                                <TableSortLabel
                                                    active={orderBy === column.id}
                                                    direction={orderBy === column.id ? order : 'asc'}
                                                    onClick={() => handleRequestSort(column.id)}
                                                >
                                                    {column.label}
                                                </TableSortLabel>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {visibleRows.map((row, index) => (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={viewMode === 'detailed' ? (row._id || row.id || index) : `${row.displayDate}-${row.projectName}-${index}`}>
                                            {columns.map((column) => {
                                                let value;
                                                // Adjust value access based on viewMode and column ID
                                                if (viewMode === 'aggregated' && column.id === 'date') {
                                                    value = row.displayDate;
                                                } else {
                                                    value = row[column.id];
                                                }

                                                return (
                                                    <TableCell key={column.id} align={column.numeric ? 'right' : 'left'} sx={{ whiteSpace: 'nowrap' }}>
                                                        {column.format ? column.format(value) : (value ?? 'N/A')}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            component="div"
                            count={sortedData.length} // Use the length of the currently sorted data
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </>
                )}
            </Paper>
        </Container>
    );
}