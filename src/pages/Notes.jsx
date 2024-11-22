import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Grid,
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
} from '@mui/icons-material';
import { notes } from '../services/api';

const COLORS = [
  { value: '#FFFFFF', label: 'Default' },
  { value: '#90CAF9', label: 'Blue' },
  { value: '#A5D6A7', label: 'Green' },
  { value: '#FFCC80', label: 'Orange' },
  { value: '#EF9A9A', label: 'Red' },
  { value: '#CE93D8', label: 'Purple' },
  { value: '#FFF59D', label: 'Yellow' },
];

const Notes = () => {
  const [open, setOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#FFFFFF',
    tags: [],
    tagInput: '',
  });

  const queryClient = useQueryClient();
  
  const { data: notesData, isLoading, error: queryError } = useQuery('notes', notes.getAll, {
    onSuccess: (data) => {
      console.log('Notes data received:', data);
    },
    onError: (err) => {
      console.error('Error fetching notes:', err);
      setError(err.response?.data?.message || 'Failed to fetch notes');
    },
  });

  const createMutation = useMutation(notes.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('notes');
      handleClose();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to create note');
    },
  });

  const updateMutation = useMutation(
    (note) => notes.update(note._id, note),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notes');
        handleClose();
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to update note');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => notes.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notes');
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to delete note');
      },
    }
  );

  const handleOpen = (note = null) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title || '',
        content: note.content || '',
        color: note.color || '#FFFFFF',
        tags: note.tags || [],
        tagInput: '',
      });
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        color: '#FFFFFF',
        tags: [],
        tagInput: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      color: '#FFFFFF',
      tags: [],
      tagInput: '',
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const noteData = {
      title: formData.title,
      content: formData.content,
      tags: formData.tags,
      color: formData.color,
    };

    if (editingNote) {
      updateMutation.mutate({
        _id: editingNote._id,
        ...noteData,
      });
    } else {
      createMutation.mutate(noteData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (formData.tagInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...new Set([...prev.tags, prev.tagInput.trim()])],
        tagInput: '',
      }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(e);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
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

  if (queryError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography color="error">Error: {error || 'Failed to load notes'}</Typography>
      </Box>
    );
  }

  if (!notesData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>No notes found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Notes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Note
        </Button>
      </Box>

      <Grid container spacing={2}>
        {notesData?.map((note) => (
          <Grid item xs={12} sm={6} md={4} key={note._id}>
            <Card sx={{ bgcolor: `${note.color}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {note.title}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {note.content}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {note.tags?.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      color="primary"
                      sx={{ bgcolor: note.color !== '#FFFFFF' ? note.color : undefined }}
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <IconButton onClick={() => handleOpen(note)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => deleteMutation.mutate(note._id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingNote ? 'Edit Note' : 'Create New Note'}
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
              name="content"
              label="Content"
              multiline
              rows={4}
              fullWidth
              value={formData.content}
              onChange={handleChange}
              required
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Color</InputLabel>
              <Select
                name="color"
                value={formData.color}
                onChange={handleChange}
                label="Color"
              >
                {COLORS.map((color) => (
                  <MenuItem 
                    key={color.value} 
                    value={color.value}
                    sx={{ 
                      backgroundColor: color.value,
                      '&:hover': { backgroundColor: color.value },
                    }}
                  >
                    {color.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  name="tagInput"
                  label="Add Tags"
                  value={formData.tagInput}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  sx={{ flex: 1 }}
                  helperText="Press Enter or click Add to add a tag"
                />
                <Button
                  onClick={handleAddTag}
                  variant="contained"
                  sx={{ mt: 1 }}
                >
                  Add Tag
                </Button>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    color="primary"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!formData.title.trim() || !formData.content.trim()}
            >
              {editingNote ? 'Update' : 'Create'}
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

export default Notes;
