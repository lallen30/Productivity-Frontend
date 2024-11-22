import { useQuery } from 'react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  FormatListBulleted as TodoIcon,
  Note as NoteIcon,
  Event as EventIcon,
  Notifications as ReminderIcon,
} from '@mui/icons-material';
import { todos, notes, events, reminders } from '../services/api';

const DashboardCard = ({ title, count, icon, loading, error }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" component="div" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      {loading ? (
        <CircularProgress size={20} />
      ) : error ? (
        <Typography color="error">Error loading data</Typography>
      ) : (
        <Typography variant="h4">{count}</Typography>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { data: todosData, isLoading: todosLoading, error: todosError } = useQuery(
    'todos',
    todos.getAll
  );

  const { data: notesData, isLoading: notesLoading, error: notesError } = useQuery(
    'notes',
    notes.getAll
  );

  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useQuery(
    'events',
    events.getAll
  );

  const { data: remindersData, isLoading: remindersLoading, error: remindersError } = useQuery(
    'reminders',
    reminders.getAll
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Todos"
            count={todosData?.length || 0}
            icon={<TodoIcon color="primary" />}
            loading={todosLoading}
            error={todosError}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Notes"
            count={notesData?.length || 0}
            icon={<NoteIcon color="primary" />}
            loading={notesLoading}
            error={notesError}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Events"
            count={eventsData?.length || 0}
            icon={<EventIcon color="primary" />}
            loading={eventsLoading}
            error={eventsError}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Reminders"
            count={remindersData?.length || 0}
            icon={<ReminderIcon color="primary" />}
            loading={remindersLoading}
            error={remindersError}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
