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
  Checkbox,
  Paper,
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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { todos } from '../services/api';

const Todos = () => {
  const [open, setOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
  });

  const queryClient = useQueryClient();
  
  const { data: todosData, isLoading } = useQuery('todos', todos.getAll, {
    onError: (err) => {
      console.error('Error fetching todos:', err);
      setError(err.response?.data?.message || 'Failed to fetch todos');
    },
  });

  const createMutation = useMutation(todos.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('todos');
      handleClose();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to create todo');
    },
  });

  const updateMutation = useMutation(
    (todo) => todos.update(todo._id, todo),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('todos');
        handleClose();
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to update todo');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => todos.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('todos');
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to delete todo');
      },
    }
  );

  const handleOpen = (todo = null) => {
    if (todo) {
      setEditingTodo(todo);
      setFormData({
        title: todo.title || '',
        description: todo.description || '',
        priority: todo.priority || 'medium',
        status: todo.status || 'pending',
      });
    } else {
      setEditingTodo(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTodo(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTodo) {
      const updatedTodo = {
        _id: editingTodo._id,
        ...formData,
      };
      updateMutation.mutate(updatedTodo);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusToggle = (todo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    const updatedTodo = {
      _id: todo._id,
      ...todo,
      status: newStatus,
    };
    updateMutation.mutate(updatedTodo);
  };

  const handleErrorClose = () => {
    setError('');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Todos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Todo
        </Button>
      </Box>

      <Paper>
        <List>
          {todosData?.map((todo) => (
            <ListItem
              key={todo._id}
              sx={{
                borderBottom: '1px solid #eee',
                opacity: todo.status === 'completed' ? 0.6 : 1,
              }}
            >
              <Checkbox
                checked={todo.status === 'completed'}
                onChange={() => handleStatusToggle(todo)}
              />
              <ListItemText
                primary={todo.title}
                secondary={
                  <>
                    <Typography component="span" variant="body2">
                      {todo.description}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 1 }}
                      color="text.secondary"
                    >
                      • {todo.priority}
                    </Typography>
                  </>
                }
                sx={{
                  textDecoration:
                    todo.status === 'completed' ? 'line-through' : 'none',
                }}
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => handleOpen(todo)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => deleteMutation.mutate(todo._id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingTodo ? 'Edit Todo' : 'Create New Todo'}
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
              type="text"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!formData.title.trim()}
            >
              {editingTodo ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleErrorClose} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Todos;
