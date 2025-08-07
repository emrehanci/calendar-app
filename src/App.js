import React, { useEffect, useState } from 'react';
import { Calendar, Modal, Form, Select, DatePicker, Button, Spin, message, Popconfirm } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
const { confirm } = Modal;
const { Option } = Select;
dayjs.extend(isBetween);

const App = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [dropdownData, setDropdownData] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    fetchEvents();
    axios.get('/dropdowns.json').then(res => setDropdownData(res.data));
  }, []);

  const fetchEvents = async () => {
    const res = await axios.get('http://localhost:3001/events');
    setEvents(res.data);
    setFilteredEvents(res.data);
  };

  const createEvent = async (event) => {
    await axios.post('http://localhost:3001/events', event);
  };
  
  const updateEvent = async (id, event) => {
    await axios.put(`http://localhost:3001/events/${id}`, event);
  };
  
  const deleteEvent = async (id) => {
    await axios.delete(`http://localhost:3001/events/${id}`);
  };

  const handleAddOrUpdate = async values => {
    const newEvent = {
      id: editMode && selectedEventId ? selectedEventId : uuidv4(),
      ...values,
      start: values.start.format('YYYY-MM-DD'),
      end: values.end.format('YYYY-MM-DD'),
    };

    let updatedEvents = [];

    if (editMode && selectedEventId) {
      updatedEvents = events.map(e => (e.id === selectedEventId ? newEvent : e));
      message.success('Event updated');
    } else {
      updatedEvents = [...events, newEvent];
      message.success('Event added');
    }

    setEvents(updatedEvents);
    setFilteredEvents(updatedEvents);
    if (editMode && selectedEventId) {
      await updateEvent(selectedEventId, newEvent);
    } else {
      await createEvent(newEvent);
    }
    setModalVisible(false);
    form.resetFields();
    setEditMode(false);
    setSelectedEventId(null);
  };

  const handleFilter = person => {
    setFilteredEvents(events.filter(e => e.name === person));
  };

  const onUpdate = (event) => {
    form.setFieldsValue({
      ...event,
      start: dayjs(event.start),
      end: dayjs(event.end)
    });
    setModalVisible(true);
    setEditMode(true);
    setSelectedEventId(event.id);
  }

  const onDelete = async (event) => {
    const updated = events.filter(e => e.id !== event.id);
    setEvents(updated);
    setFilteredEvents(updated);
    await deleteEvent(event.id);
    message.success('Event deleted');
  }

  const dateCellRender = value => {
    const currentDate = value.format('YYYY-MM-DD');
    const dayEvents = filteredEvents.filter(e => dayjs(currentDate).isBetween(e.start, e.end, null, '[]'));
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {dayEvents.map((item) => (
          <Popconfirm
          title="Do you want to update or delete this event?"
          onConfirm={() => onDelete(item)}
          onCancel={() => onUpdate(item)}
          okText="Delete"
          cancelText="Update"
        >
          <strong>{item.name}</strong> - {item.type}
        </Popconfirm>
        ))}
      </ul>
    );
  };

  if (!dropdownData) return <Spin />;

  return (
    <div style={{ padding: 24 }}>
      <h2>Calendar App</h2>
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by person"
          onChange={handleFilter}
          allowClear
          style={{ width: 200 }}
        >
          {dropdownData.names.map(name => <Option key={name} value={name}>{name}</Option>)}
        </Select>
        <Button type="primary" style={{ marginLeft: 16 }} onClick={() => setModalVisible(true)}>Add New Entry</Button>
      </div>
      <Calendar cellRender={dateCellRender} />

      <Modal
        title={editMode ? "Update Event" : "Add New Holiday"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditMode(false);
        }}
        onOk={() => form.submit()}
        okText="Submit"
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrUpdate}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}> 
            <Select>
              {dropdownData.names.map(name => <Option key={name} value={name}>{name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="start" label="Start Date" rules={[{ required: true }]}> 
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end" label="End Date" rules={[{ required: true }]}> 
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}> 
            <Select>
              {dropdownData.types.map(type => <Option key={type} value={type}>{type}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="team" label="Team" rules={[{ required: true }]}> 
            <Select>
              {dropdownData.teams.map(team => <Option key={team} value={team}>{team}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="domain" label="Domain" rules={[{ required: true }]}> 
            <Select>
              {dropdownData.domains.map(domain => <Option key={domain} value={domain}>{domain}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true }]}> 
            <Select>
              {dropdownData.locations.map(loc => <Option key={loc} value={loc}>{loc}</Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default App;