import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Notifications,
} from '@mui/icons-material';
import { reminders } from '../services/api';
import { format } from 'date-fns';

const PRIORITIES = ['low', 'medium', 'high'];
const REPEAT_OPTIONS = ['none', 'daily', 'weekly', 'monthly'];

const Reminders = () => {
  const [open, setOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    priority: 'low',
    repeat: 'none'
  });

  const queryClient = useQueryClient();
  
  const { data: remindersData, isLoading, error: queryError } = useQuery('reminders', reminders.getAll, {
    onError: (err) => {
      console.error('Error fetching reminders:', err);
      setError(err.response?.data?.message || 'Failed to fetch reminders');
    },
  });

  const createMutation = useMutation(reminders.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('reminders');
      handleClose();
    },
    onError: (err) => {
      console.error('Error creating reminder:', err);
      console.error('Error response:', err.response?.data);
      console.error('Request data:', err.config?.data); // Log the request data
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        'Failed to create reminder'
      );
    },
  });

  const updateMutation = useMutation(
    (reminder) => reminders.update(reminder._id, reminder),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('reminders');
        handleClose();
      },
      onError: (err) => {
        console.error('Error updating reminder:', err);
        console.error('Error response:', err.response?.data);
        console.error('Request data:', err.config?.data); // Log the request data
        setError(err.response?.data?.message || 'Failed to update reminder');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => reminders.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('reminders');
      },
      onError: (err) => {
        console.error('Error deleting reminder:', err);
        setError(err.response?.data?.message || 'Failed to delete reminder');
      },
    }
  );

  const handleOpen = (reminder = null) => {
    if (reminder) {
      setEditingReminder(reminder);
      setFormData({
        title: reminder.title || '',
        description: reminder.description || '',
        date: reminder.dueDate ? formatDateForInput(reminder.dueDate) : formatDateForInput(new Date()),
        priority: reminder.priority || 'low',
        repeat: reminder.repeat || 'none'
      });
    } else {
      setEditingReminder(null);
      setFormData({
        title: '',
        description: '',
        date: formatDateForInput(new Date()),
        priority: 'low',
        repeat: 'none'
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingReminder(null);
    setFormData({
      title: '',
      description: '',
      date: formatDateForInput(new Date()),
      priority: 'low',
      repeat: 'none'
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      // Convert the date to full ISO format with timezone
      const dueDate = new Date(formData.date).toISOString();
      
      const reminderData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate,
        priority: formData.priority,
        repeat: formData.repeat,
        status: 'pending'
      };

      // Log the exact data being sent
      console.log('Submitting reminder with data:', JSON.stringify(reminderData, null, 2));

      if (editingReminder) {
        updateMutation.mutate({ ...reminderData, _id: editingReminder._id });
      } else {
        createMutation.mutate(reminderData);
      }
    } catch (err) {
      console.error('Error preparing reminder data:', err);
      setError('Failed to prepare reminder data: ' + err.message);
    }
  };

  const formatDateForInput = (date) => {
    return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleErrorClose = () => {
    setError('');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
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
        <Typography color="error">Error: {error || 'Failed to load reminders'}</Typography>
      </Box>
    );
  }

  if (!remindersData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>No reminders found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Reminders</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Reminder
        </Button>
      </Box>

      <List>
        {remindersData?.map((reminder) => (
          <ListItem
            key={reminder._id}
            sx={{
              mb: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">{reminder.title}</Typography>
                  <Chip
                    size="small"
                    label={reminder.priority}
                    color={
                      reminder.priority === 'high'
                        ? 'error'
                        : reminder.priority === 'medium'
                        ? 'warning'
                        : 'success'
                    }
                  />
                  {reminder.repeat !== 'none' && (
                    <Chip
                      size="small"
                      label={reminder.repeat}
                      color="info"
                      icon={<Notifications />}
                    />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {reminder.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Due: {reminder.dueDate ? format(new Date(reminder.dueDate), 'PPp') : 'No date set'}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton onClick={() => handleOpen(reminder)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => deleteMutation.mutate(reminder._id)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Title"
              type="text"
              fullWidth
              value={formData.title}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={formData.description}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="date"
              label="Due Date"
              type="datetime-local"
              fullWidth
              value={formData.date}
              onChange={handleChange}
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                label="Priority"
              >
                {PRIORITIES.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Repeat</InputLabel>
              <Select
                name="repeat"
                value={formData.repeat}
                onChange={handleChange}
                label="Repeat"
              >
                {REPEAT_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingReminder ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleErrorClose}
      >
        <Alert onClose={handleErrorClose} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Reminders;
