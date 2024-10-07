import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Card, CardContent, Grid, 
  TextField, Button, FormControlLabel, Switch, 
  Select, MenuItem, InputLabel, FormControl, Snackbar,
  Paper, Checkbox, ListItemText, OutlinedInput, Tooltip,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { exportToPDF } from "./PDFExport";

const FacSched = () => {
  const [facultyInfo, setFacultyInfo] = useState({
    name: '',
    semester: ''
  });

  const [formData, setFormData] = useState({
    type: '',
    days: [],
    startTime: null,
    endTime: null,
    description: '',
    isOverload: false,
    className: '',
    classLocation: ''
  });

  const [schedule, setSchedule] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: []
  });

  const [totals, setTotals] = useState({
    teachingHours: 0,
    studentHours: 0,
    campusHours: 0,
    overloadHours: 0
  });

  const [totalHours, setTotalHours] = useState(0);
  const [totalMinusOverload, setTotalMinusOverload] = useState(0);

  const [editingEvent, setEditingEvent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEventClick = (day, index) => {
    const event = schedule[day][index];
    setEditingEvent({ ...event, day, index });
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (name, value) => {
    setEditingEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSave = () => {
    if (editingEvent) {
      const { day, index, ...eventData } = editingEvent;
      const updatedSchedule = { ...schedule };
      const oldEvent = updatedSchedule[day][index];
      updatedSchedule[day][index] = eventData;
      setSchedule(updatedSchedule);
  
      // Calculate old and new durations
      const oldDuration = calculateDuration(
        dayjs(oldEvent.startTime, 'HH:mm'),
        dayjs(oldEvent.endTime, 'HH:mm')
      );
      const newDuration = calculateDuration(
        dayjs(eventData.startTime, 'HH:mm'),
        dayjs(eventData.endTime, 'HH:mm')
      );
  
      // Remove old event from totals
      updateTotals(oldEvent.type, -oldDuration, oldEvent.isOverload);
  
      // Add new event to totals
      updateTotals(eventData.type, newDuration, eventData.isOverload);
  
      setIsEditModalOpen(false);
      setEditingEvent(null);
      setSnackbar({ open: true, message: 'Event updated successfully.' });
    }
  };


  const [snackbar, setSnackbar] = useState({
    open: false,
    message: ''
  });

  const scheduleRef = useRef(null);
  const summaryRef = useRef(null);

  useEffect(() => {
    const newTotals = {
      teachingHours: 0,
      studentHours: 0,
      campusHours: 0,
      overloadHours: 0
    };
  
    Object.values(schedule).forEach(daySchedule => {
      daySchedule.forEach(event => {
        const duration = calculateDuration(
          dayjs(event.startTime, 'HH:mm'),
          dayjs(event.endTime, 'HH:mm')
        );
  
        if (event.isOverload) {
          newTotals.overloadHours += duration;
        } else if (event.type === 'teaching') {
          newTotals.teachingHours += duration;
        } else if (event.type === 'student') {
          newTotals.studentHours += duration;
        } else if (event.type === 'campus') {
          newTotals.campusHours += duration;
        }
      });
    });
  
    setTotals(newTotals);
  
    const newTotalHours = newTotals.teachingHours + newTotals.studentHours + newTotals.campusHours + newTotals.overloadHours;
    setTotalHours(newTotalHours);
    setTotalMinusOverload(newTotalHours - newTotals.overloadHours);
  }, [schedule]);

  const calculateDuration = (startTime, endTime) => {
    return endTime.diff(startTime, 'hour', true);
  };

  const updateTotals = (type, duration, isOverload) => {
    setTotals(prevTotals => {
      const newTotals = { ...prevTotals };
      if (isOverload) {
        newTotals.overloadHours = Math.max(0, newTotals.overloadHours + duration);
      } else if (type === 'teaching') {
        newTotals.teachingHours = Math.max(0, newTotals.teachingHours + duration);
      } else if (type === 'student') {
        newTotals.studentHours = Math.max(0, newTotals.studentHours + duration);
      } else if (type === 'campus') {
        newTotals.campusHours = Math.max(0, newTotals.campusHours + duration);
      }
      return newTotals;
    });
  };

  const addHours = (event) => {
    event.preventDefault();
    const { type, days, startTime, endTime, description, isOverload, className, classLocation } = formData;
    
    if (!type || days.length === 0 || !startTime || !endTime) {
      setSnackbar({ open: true, message: 'Please fill in all required fields.' });
      return;
    }

    if (type === 'teaching' && (!className || !classLocation)) {
      setSnackbar({ open: true, message: 'Please provide class name and location for teaching hours.' });
      return;
    }

    const duration = calculateDuration(startTime, endTime);
    const newEntry = { 
      ...formData, 
      duration, 
      startTime: startTime.format('HH:mm'), 
      endTime: endTime.format('HH:mm'),
      className: type === 'teaching' ? className : undefined,
      classLocation: type === 'teaching' ? classLocation : undefined
    };

    setSchedule(prevSchedule => {
      const newSchedule = { ...prevSchedule };
      days.forEach(day => {
        newSchedule[day.toLowerCase()] = [...newSchedule[day.toLowerCase()], newEntry];
      });
      return newSchedule;
    });

    updateTotals(type, duration * days.length, isOverload);

    setFormData({
      type: '',
      days: [],
      startTime: null,
      endTime: null,
      description: '',
      isOverload: false,
      className: '',
      classLocation: ''
    });

    setSnackbar({ open: true, message: 'Hours added to schedule.' });
  };

  const handleExportToPDF = () => {
    if (scheduleRef.current && summaryRef.current) {
      exportToPDF(scheduleRef.current, summaryRef.current, facultyInfo)
        .then(() => setSnackbar({ open: true, message: 'Schedule exported to PDF successfully!' }))
        .catch(error => setSnackbar({ open: true, message: 'Error exporting to PDF. Please try again.' }));
    } else {
      setSnackbar({ open: true, message: 'Error: Schedule or summary not found.' });
    }
  };

  const handleFacultyInfoChange = (event) => {
    const { name, value } = event.target;
    setFacultyInfo(prevInfo => ({
      ...prevInfo,
      [name]: value
    }));
  };

  const handleInputChange = (event) => {
    const { name, value, checked } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: name === 'isOverload' ? checked : value
    }));
  };

  const handleDaysChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData(prevData => ({
      ...prevData,
      days: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleTimeChange = (name) => (newValue) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: newValue
    }));
  };
  const timeSlots = Array.from({ length: 30 }, (_, i) => {
    const hour = Math.floor(i / 2) + 6;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getColorForType = (type) => {
    switch (type) {
      case 'teaching': return '#FFB3BA'; // Light pink
      case 'student': return '#BAFFC9'; // Light green
      case 'campus': return '#BAE1FF'; // Light blue
      default: return '#FFFFFF'; // White
    }
  };

  const timeToGridRow = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours - 6) * 2 + (minutes === 30 ? 1 : 0) + 2; // +2 to account for header row
  };

  const calculateEventHeight = (startTime, endTime) => {
    const start = timeToGridRow(startTime);
    const end = timeToGridRow(endTime);
    return end - start;
  };

  const deleteEvent = (day, index) => {
    setSchedule(prevSchedule => {
      const newSchedule = { ...prevSchedule };
      const deletedEvent = newSchedule[day][index];
      newSchedule[day] = newSchedule[day].filter((_, i) => i !== index);
      
      // Update totals
      const duration = calculateDuration(dayjs(deletedEvent.startTime, 'HH:mm'), dayjs(deletedEvent.endTime, 'HH:mm'));
      updateTotals(deletedEvent.type, -duration, deletedEvent.isOverload);
      
      return newSchedule;
    });
    setSnackbar({ open: true, message: 'Event deleted from schedule.' });
  };

  const renderScheduleGrid = () => {
    return (
      <Box sx={{ flexGrow: 1, mt: 4, position: 'relative', height: 'calc(30 * 30px)' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Time column */}
          <Grid item xs={1} sx={{ position: 'relative' }}>
            {timeSlots.map((time, index) => (
              <Typography 
                key={time} 
                variant="caption" 
                sx={{ 
                  position: 'absolute', 
                  right: '8px', 
                  top: `calc(${index * 30}px + 15px)`, 
                  transform: 'translateY(-50%)'
                }}
              >
                {time}
              </Typography>
            ))}
          </Grid>

          {/* Days columns */}
          {days.map((day) => (
            <Grid item xs={1.8} key={day} sx={{ position: 'relative', height: '100%', borderRight: '1px solid #ccc' }}>
              <Typography variant="subtitle2" align="center" sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                {day}
              </Typography>
              {schedule[day.toLowerCase()].map((event, index) => {
                const startRow = timeToGridRow(event.startTime);
                const height = calculateEventHeight(event.startTime, event.endTime);
                return (
                  <Tooltip 
                    title={`${event.description || 'No description'}${event.classLocation ? ` - ${event.classLocation}` : ''}`} 
                    key={`${day}-${index}`}
                  >
                    <Paper 
                      elevation={3}
                      sx={{
                        position: 'absolute',
                        top: `calc(${startRow * 30}px - 30px)`,
                        left: '2px',
                        right: '2px',
                        height: `calc(${height * 30}px - 4px)`,
                        backgroundColor: getColorForType(event.type),
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '0.65rem',
                        padding: '2px',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleEventClick(day.toLowerCase(), index)}
                    >
                    
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {event.type === 'teaching' ? event.className : event.type === 'student' ? "Student Hours" : "Campus Hours"}
                        {event.isOverload && ' 📚'}
                      </Typography>
                      <Typography variant="caption">
                        {event.startTime} - {event.endTime}
                      </Typography>
                      {event.classLocation && (
                        <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                          {event.classLocation}
                        </Typography>
                      )}
                      {event.description && (
                        <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '0.6rem' }}>
                          {event.description.length > 10 ? `${event.description.substring(0, 10)}...` : event.description}
                        </Typography>
                      )}
                      <IconButton 
                        size="small" 
                        onClick={() => deleteEvent(day.toLowerCase(), index)}
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          padding: '2px',
                          '& svg': { fontSize: '0.8rem' }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Paper>
                  </Tooltip>
                );
              })}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };
  const saveSchedule = () => {
    const data = {
      facultyInfo,
      schedule,
      totals
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${facultyInfo.name.replace(/\s+/g, '_')}_schedule.cccsched`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: 'Schedule saved successfully!' });
  };

  const EditEventModal = () => (
    <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
      <DialogTitle>Edit Event</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel id="edit-type-label">Type of Hours</InputLabel>
          <Select
            labelId="edit-type-label"
            value={editingEvent?.type || ''}
            onChange={(e) => handleEditInputChange('type', e.target.value)}
            label="Type of Hours"
          >
            <MenuItem value="teaching">Teaching</MenuItem>
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="campus">Campus</MenuItem>
          </Select>
        </FormControl>
        <TimePicker
          label="Start Time"
          value={dayjs(editingEvent?.startTime, 'HH:mm')}
          onChange={(newValue) => handleEditInputChange('startTime', newValue.format('HH:mm'))}
          renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
        />
        <TimePicker
          label="End Time"
          value={dayjs(editingEvent?.endTime, 'HH:mm')}
          onChange={(newValue) => handleEditInputChange('endTime', newValue.format('HH:mm'))}
          renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Description"
          value={editingEvent?.description || ''}
          onChange={(e) => handleEditInputChange('description', e.target.value)}
        />
        {editingEvent?.type === 'teaching' && (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="Class Name"
              value={editingEvent?.className || ''}
              onChange={(e) => handleEditInputChange('className', e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Class Location"
              value={editingEvent?.classLocation || ''}
              onChange={(e) => handleEditInputChange('classLocation', e.target.value)}
            />
          </>
        )}
        <FormControlLabel
          control={
            <Switch
              checked={editingEvent?.isOverload || false}
              onChange={(e) => handleEditInputChange('isOverload', e.target.checked)}
            />
          }
          label="Overload"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
        <Button onClick={handleEditSave} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );

  const loadSchedule = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setFacultyInfo(data.facultyInfo);
          setSchedule(data.schedule);
          setTotals(data.totals);
          setSnackbar({ open: true, message: 'Schedule loaded successfully!' });
        } catch (error) {
          setSnackbar({ open: true, message: 'Error loading schedule. Please try again.' });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Faculty Schedule Builder
        </Typography>
        
        <Card sx={{ mb: 4 }} >
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Faculty Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Faculty Name"
                  name="name"
                  value={facultyInfo.name}
                  onChange={handleFacultyInfoChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Semester"
                  name="semester"
                  value={facultyInfo.semester}
                  onChange={handleFacultyInfoChange}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Add Hours
            </Typography>
            <Box component="form" onSubmit={addHours} sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="type-label">Type of Hours</InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  label="Type of Hours"
                >
                  <MenuItem value="teaching">Teaching</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="campus">Campus</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel id="days-label">Days</InputLabel>
                <Select
                  labelId="days-label"
                  multiple
                  value={formData.days}
                  onChange={handleDaysChange}
                  input={<OutlinedInput label="Days" />}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {days.map((day) => (
                    <MenuItem key={day} value={day}>
                      <Checkbox checked={formData.days.indexOf(day) > -1} />
                      <ListItemText primary={day} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TimePicker
                label="Start Time"
                value={formData.startTime}
                onChange={handleTimeChange('startTime')}
                renderInput={(params) => <TextField {...params} />}
              />
              <TimePicker
                label="End Time"
                value={formData.endTime}
                onChange={handleTimeChange('endTime')}
                renderInput={(params) => <TextField {...params} />}
              />
              <TextField
                fullWidth
                margin="normal"
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
              />
              {formData.type === 'teaching' && (
                <>
                  <TextField
                    fullWidth
                    margin="normal"
                    name="className"
                    label="Class Name"
                    value={formData.className}
                    onChange={handleInputChange}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    name="classLocation"
                    label="Class Location"
                    value={formData.classLocation}
                    onChange={handleInputChange}
                  />
                </>
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isOverload}
                    onChange={handleInputChange}
                    name="isOverload"
                  />
                }
                label="Overload"
              />
              <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                Add Hours
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }} ref={summaryRef}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Hours Summary
            </Typography>
            <Typography variant="body1">Teaching Hours: {totals.teachingHours.toFixed(2)}</Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                fontStyle: totals.studentHours === 8 ? 'normal' : 'italic',
                color: totals.studentHours === 8 ? 'inherit' : 'red'
              }}
            >
              Student Hours: {totals.studentHours.toFixed(2)}
            </Typography>
            <Typography variant="body1">Campus Hours: {totals.campusHours.toFixed(2)}</Typography>
            <Typography variant="body1">Overload Hours: {totals.overloadHours.toFixed(2)}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Total Hours: {totalHours.toFixed(2)}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Total Minus Overload: {totalMinusOverload.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>

        <Card ref={scheduleRef}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Weekly Schedule for {facultyInfo.name} - {facultyInfo.semester}
            </Typography>
            {renderScheduleGrid()}
          </CardContent>
        </Card>
        <EditEventModal />
 <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveSchedule}
          >
            Save Schedule
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<UploadIcon />}
            component="label"
          >
            Load Schedule
            <input
              type="file"
              hidden
              accept=".cccsched"
              onChange={loadSchedule}
            />
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleExportToPDF}
          >
            Export Schedule
          </Button>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Container>
    </LocalizationProvider>
  );
};

export default FacSched;