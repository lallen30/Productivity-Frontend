import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  LocationOn,
  People,
  AccessTime,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Configure axios with base URL and auth interceptor
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const Events = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    location: '',
    participants: '',
    isAllDay: false
  });

  const queryClient = useQueryClient();
  
  const { data: eventsData = [], isLoading, error: queryError } = useQuery('events', 
    async () => {
      try {
        const response = await api.get('/api/events');
        return response.data;
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        }
        throw err;
      }
    },
    {
      onError: (err) => {
        console.error('Error fetching events:', err);
        if (err.response?.status !== 401) {
          setError(err.response?.data?.message || 'Failed to fetch events');
        }
      },
      refetchOnWindowFocus: true,
      refetchInterval: 5000,
      staleTime: 0,
      retry: (failureCount, error) => {
        // Don't retry on 401 errors
        if (error.response?.status === 401) return false;
        return failureCount < 3;
      }
    }
  );

  const createMutation = useMutation(
    (newEvent) => api.post('/api/events', newEvent),
    {
      onSuccess: (response) => {
        console.log('Event created successfully:', response.data);
        try {
          // Get current events from cache
          const currentEvents = queryClient.getQueryData('events') || [];
          console.log('Current events in cache:', currentEvents);
          
          // Ensure we have arrays to work with
          const eventsArray = Array.isArray(currentEvents) ? currentEvents : [];
          const newEventData = response.data;
          
          // Update the cache with the new event
          queryClient.setQueryData('events', [...eventsArray, newEventData]);
          console.log('Cache updated successfully');
          
          // Invalidate the query to trigger a refetch
          queryClient.invalidateQueries('events');
          handleClose();
        } catch (error) {
          console.error('Error updating cache:', error);
          // Fallback: just invalidate and refetch
          queryClient.invalidateQueries('events');
          handleClose();
        }
      },
      onError: (err) => {
        console.error('Create Event Error Details:', {
          response: err.response?.data,
          status: err.response?.status,
          headers: err.response?.headers,
          message: err.message,
          stack: err.stack
        });
        const errorMessage = err.response?.data?.message || err.message || 'Failed to create event';
        setError(`Error: ${errorMessage}`);
      },
    });

  const updateMutation = useMutation(
    (updatedEvent) => api.put(`/api/events/${updatedEvent._id}`, updatedEvent),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('events');
        handleClose();
      },
      onError: (err) => {
        console.error('Update Event Error:', err.response?.data || err);
        setError(err.response?.data?.message || err.message || 'Failed to update event');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/api/events/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('events');
      },
      onError: (err) => {
        console.error('Delete Event Error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to delete event');
      },
    }
  );

  const formatDateForInput = (date, isAllDay = false) => {
    const d = new Date(date);
    if (isAllDay) {
      return format(d, 'yyyy-MM-dd');
    }
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  const handleOpen = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        startDate: event.startDate ? formatDateForInput(event.startDate, event.isAllDay) : formatDateForInput(new Date(), false),
        endDate: event.endDate ? formatDateForInput(event.endDate, event.isAllDay) : formatDateForInput(new Date(), false),
        location: event.location || '',
        participants: Array.isArray(event.participants) ? event.participants.join(', ') : '',
        isAllDay: event.isAllDay || false
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        startDate: formatDateForInput(new Date(), false),
        endDate: formatDateForInput(new Date(), false),
        location: '',
        participants: '',
        isAllDay: false
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingEvent(null);
    setError('');
    // Reset form data after a short delay to prevent visual glitches
    setTimeout(() => {
      setFormData({
        title: '',
        description: '',
        startDate: formatDateForInput(new Date(), false),
        endDate: formatDateForInput(new Date(), false),
        location: '',
        participants: '',
        isAllDay: false
      });
    }, 100);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'participants') {
      // Allow typing commas by not immediately splitting the input
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (type === 'checkbox') {
      if (name === 'isAllDay') {
        // When toggling isAllDay, reformat the dates
        setFormData(prev => ({
          ...prev,
          isAllDay: checked,
          startDate: formatDateForInput(prev.startDate, checked),
          endDate: formatDateForInput(prev.endDate, checked)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else if (name === 'startDate' || name === 'endDate') {
      // For date fields, preserve the format based on isAllDay
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validate dates
      const startDateTime = new Date(formData.startDate);
      const endDateTime = new Date(formData.endDate);
      
      if (formData.isAllDay) {
        // For all-day events, allow same day
        const startDate = new Date(startDateTime.setHours(0, 0, 0, 0));
        const endDate = new Date(endDateTime.setHours(23, 59, 59, 999));
        if (endDate < startDate) {
          setError('End date cannot be before start date');
          return;
        }
      } else {
        // For regular events, end time must be equal to or after start time
        if (endDateTime < startDateTime) {
          setError('End time must be equal to or after start time');
          return;
        }
      }

      // Parse participants string into array
      const participantList = formData.participants
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      // Format the data for the API
      const eventData = {
        title: formData.title,
        description: formData.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: formData.location,
        participants: participantList,
        isAllDay: formData.isAllDay
      };

      console.log(editingEvent ? 'Updating event:' : 'Creating event:', eventData);
      
      if (editingEvent) {
        await updateMutation.mutateAsync({
          _id: editingEvent._id,
          ...eventData
        });
      } else {
        await createMutation.mutateAsync(eventData);
      }
    } catch (err) {
      console.error('Failed to save event:', err.response?.data || err);
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors
          .map(error => error.msg)
          .join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to save event');
      }
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (queryError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Alert severity="error">{queryError.message}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Events</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen()}
          sx={{ mb: 3 }}
        >
          Add Event
        </Button>
      </Box>

      <Grid container spacing={3}>
        {Array.isArray(eventsData) ? eventsData.map((event) => (
          <Grid item xs={12} sm={6} md={4} key={event._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {event.title}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {event.isAllDay ? (
                    format(new Date(event.startDate), 'PPP')
                  ) : (
                    format(new Date(event.startDate), 'PPpp')
                  )}
                </Typography>
                {event.description && (
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {event.description}
                  </Typography>
                )}
                {event.location && (
                  <Typography variant="body2" color="text.secondary">
                    📍 {event.location}
                  </Typography>
                )}
                {event.participants && event.participants.length > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    👥 Participants: {event.participants.join(', ')}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleOpen(event)}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => deleteMutation.mutate(event._id)}>
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )) : (
          <Grid item xs={12}>
            <Alert severity="info">No events found. Create your first event!</Alert>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogTitle>
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                autoFocus
                name="title"
                label="Title"
                value={formData.title}
                onChange={handleInputChange}
                required
                fullWidth
              />
              
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                fullWidth
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    name="isAllDay"
                    checked={formData.isAllDay}
                    onChange={handleInputChange}
                  />
                }
                label="All Day Event"
              />

              <TextField
                name="startDate"
                label="Start Date"
                type={formData.isAllDay ? "date" : "datetime-local"}
                value={formData.startDate}
                onChange={handleInputChange}
                required
                fullWidth
                error={error && error.includes('date')}
                helperText={error && error.includes('date') ? error : ''}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <TextField
                name="endDate"
                label="End Date"
                type={formData.isAllDay ? "date" : "datetime-local"}
                value={formData.endDate}
                onChange={handleInputChange}
                required
                fullWidth
                error={error && error.includes('date')}
                helperText={error && error.includes('date') ? error : ''}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <TextField
                name="location"
                label="Location"
                value={formData.location}
                onChange={handleInputChange}
                fullWidth
              />
              
              <TextField
                name="participants"
                label="Participants"
                value={formData.participants}
                onChange={handleInputChange}
                fullWidth
                placeholder="Enter email addresses separated by commas"
                helperText="Enter email addresses separated by commas (e.g., john@example.com, jane@example.com)"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Events;
