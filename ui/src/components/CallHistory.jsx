import React, { useState, useEffect } from 'react';
import {
    Container, Box, Typography, Paper, CircularProgress, Alert,
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Tooltip, TableSortLabel, TablePagination
} from '@mui/material';
import api from '../api';

// Helper function to format numbers
const formatNumber = (num, decimals = 0) => num?.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) || 'N/A';
const formatCurrency = (num) => num?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || 'N/A'; // Allow more decimals for small costs
const formatTimestamp = (timestamp) => timestamp ? new Date(timestamp).toLocaleString() : 'N/A';

export default function CallHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orderBy, setOrderBy] = useState('timestamp'); // Default sort column
    const [order, setOrder] = useState('desc'); // Default sort order
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchCallHistory();
    }, []);

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

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const descendingComparator = (a, b, orderBy) => {
        let valA = a[orderBy];
        let valB = b[orderBy];

        // Handle timestamp comparison
        if (orderBy === 'timestamp') {
            valA = new Date(valA);
            valB = new Date(valB);
        }
        // Handle potential null/undefined values for numeric sort
        valA = valA ?? -Infinity;
        valB = valB ?? -Infinity;

        if (valB < valA) return -1;
        if (valB > valA) return 1;
        return 0;
    };

    const getComparator = (order, orderBy) => {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    };

    // Stable sort preserves original order for equal items
    const stableSort = (array, comparator) => {
        const stabilizedThis = array.map((el, index) => [el, index]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) return order;
            return a[1] - b[1]; // Use original index if comparison is equal
        });
        return stabilizedThis.map((el) => el[0]);
    };

    const sortedHistory = stableSort(history, getComparator(order, orderBy));

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page when rows per page changes
    };

    const visibleRows = sortedHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const columns = [
        { id: 'timestamp', label: 'Timestamp', minWidth: 170, numeric: false, format: formatTimestamp },
        { id: 'project_name', label: 'Project', minWidth: 150, numeric: false, format: (value) => value?.replaceAll('\\', '/').split('/').pop() }, 
        { id: 'input_tokens', label: 'Tokens In', minWidth: 100, numeric: true, format: (value) => formatNumber(value) },
        { id: 'output_tokens', label: 'Tokens Out', minWidth: 100, numeric: true, format: (value) => formatNumber(value) },
        { id: 'delay', label: 'Duration (s)', minWidth: 100, numeric: true, format: (value) => `${formatNumber(value, 2)} s` },
        { id: 'total_cost', label: 'Cost ($)', minWidth: 100, numeric: true, format: (value) => formatCurrency(value) },
        { id: 'model', label: 'Model', minWidth: 150, numeric: false },
    ];

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
                    AI Call History
                </Typography>

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

                {!loading && !error && history.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        No call history found.
                    </Typography>
                )}

                {!loading && !error && history.length > 0 && (
                    <>
                        <TableContainer sx={{ maxHeight: 600 }}> {/* Limit height and enable scroll */}
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        {columns.map((column) => (
                                            <TableCell
                                                key={column.id}
                                                align={column.numeric ? 'right' : 'left'}
                                                padding={column.disablePadding ? 'none' : 'normal'}
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
                                    {visibleRows.map((row) => (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={row._id || row.id}>
                                            {columns.map((column) => {
                                                const value = row[column.id];
                                                return (
                                                    <TableCell key={column.id} align={column.numeric ? 'right' : 'left'} sx={{whiteSpace: 'nowrap'}}>
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
                            count={history.length}
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