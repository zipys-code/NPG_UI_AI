import React, { useState } from 'react';
import {
    Box, Card, CardContent, Typography, Table, TableBody,
    TableCell, TableHead, TableRow, Chip, Button, Container
} from '@mui/material';
import {
    PlayArrow, Storage, SwapHoriz, Refresh,
    ErrorOutlined, CheckCircle, InfoOutlined
} from '@mui/icons-material';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

/**
 * NPG Control Tower - TSX Version (Marmam Dashboard)
 * Optimized with Box layout to avoid Grid/TypeScript issues.
 */

const trafficData = [
    { time: '08:00', requests: 120 },
    { time: '09:00', requests: 350 },
    { time: '10:00', requests: 840 },
    { time: '11:00', requests: 1100 },
    { time: '12:00', requests: 600 },
    { time: '13:00', requests: 450 },
    { time: '14:00', requests: 300 },
];

const processDistribution = [
    { name: 'getLOV', value: 650 },
    { name: 'InsertInterface', value: 250 },
    { name: 'Errors', value: 100 },
];

const COLORS = ['#2196f3', '#4caf50', '#f44336'];

// Status Card Component
const StatusCard = ({ title, value, color, icon, subtitle }: any) => (
    <Card sx={{ borderLeft: `6px solid ${color}`, borderRadius: 2, height: '100%' }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ mr: 1, color: color, display: 'flex' }}>{icon}</Box>
                <Typography color="textSecondary" variant="overline" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                    {title}
                </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="textSecondary">{subtitle}</Typography>}
        </CardContent>
    </Card>
);

export const NPGControlTower = (): any => {
    const [queues] = useState([
        { name: 'NPG.UI.AI.IN', pending: 0, consumers: 2, status: 'Active', tps: 12.5 },
        { name: 'NPG.UI.AI.ERROR', pending: 15, consumers: 1, status: 'Warning', tps: 0.2 },
        { name: 'NPG.CORE.SYNC', pending: 0, consumers: 4, status: 'Active', tps: 45.1 },
    ]);

    const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

    // פונקציה לריענון נתונים (סימולציה)
    const handleRefresh = () => {
        setLastUpdate(new Date().toLocaleTimeString());
        // כאן בעתיד תבוא הקריאה ל-API של טיבקו
    };

    return (
        <Box sx={{ backgroundColor: '#f0f2f5', minHeight: '100vh', py: 4 }}>
            <Container maxWidth="lg">
                {/* Header Section */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>
                            NPG Integration Control Tower
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            Monitoring TIBCO BW 5.14 | Linux Server: 10.10.14.52
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#757575', display: 'block' }}>
                            LAST HEARTBEAT FROM SERVER
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#1a237e', fontWeight: 'bold' }}>
                            {lastUpdate}
                        </Typography>
                    </Box>
                </Box>

                {/* Top KPI Row - Using Box Flex instead of Grid */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                        <StatusCard
                            title="TIBCO Engine Status"
                            value="Running"
                            color="#4caf50"
                            icon={<PlayArrow />}
                            subtitle="Up since: 02:15 AM"
                        />
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                        <StatusCard
                            title="Memory Utilization"
                            value="242MB / 1024MB"
                            color="#2196f3"
                            icon={<Storage />}
                            subtitle="Max Heap set to 1GB"
                        />
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                        <StatusCard
                            title="REST/JSON Plugin"
                            value="Pending Fix"
                            color="#f44336"
                            icon={<ErrorOutlined />}
                            subtitle="Awaiting System Install"
                        />
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                        <StatusCard
                            title="Port 8085 Connectivity"
                            value="Established"
                            color="#4caf50"
                            icon={<SwapHoriz />}
                            subtitle="Firewall: Open"
                        />
                    </Box>
                </Box>

                {/* Charts Row - Using Box Flex instead of Grid */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 65%' } }}>
                        <Card sx={{ p: 2, borderRadius: 2, height: '400px' }}>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <InfoOutlined sx={{ mr: 1, fontSize: 'small' }} /> Request Traffic (IIS - TIBCO)
                            </Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <AreaChart data={trafficData}>
                                    <defs>
                                        <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="requests" stroke="#8884d8" fill="url(#colorReq)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
                        <Card sx={{ p: 2, borderRadius: 2, height: '400px' }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Process Success Rate</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie
                                        data={processDistribution}
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {processDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Box>
                </Box>

                {/* JMS Table Section */}
                <Card sx={{ borderRadius: 2 }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">JMS Queue Management (EMS)</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" color="textSecondary">
                                Last Sync: {lastUpdate}
                            </Typography>
                            <Button variant="contained" size="small" startIcon={<Refresh />} onClick={handleRefresh}>
                                Refresh
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#fafafa' }}>
                                <TableRow>
                                    <TableCell>Queue Name</TableCell>
                                    <TableCell align="center">Pending</TableCell>
                                    <TableCell align="center">Consumers</TableCell>
                                    <TableCell align="center">TPS</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {queues.map((q) => (
                                    <TableRow key={q.name} hover>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{q.name}</TableCell>
                                        <TableCell align="center">
                                            <Typography sx={{ fontWeight: 'bold', color: q.pending > 0 ? '#f44336' : 'inherit' }}>
                                                {q.pending}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">{q.consumers}</TableCell>
                                        <TableCell align="center">{q.tps}</TableCell>
                                        <TableCell align="center">
                                            <Chip label={q.status} size="small" color={q.status === 'Active' ? 'success' : 'warning'} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button size="small">Browse</Button>
                                            <Button size="small" color="error">Purge</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                </Card>
            </Container>
        </Box>
    );
};