import React, { useEffect, useState } from 'react';
import {
  Calendar, Modal, Form, Select, DatePicker, Button, Spin, message, Popconfirm, Input
} from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const { Option } = Select;
dayjs.extend(isBetween);

const App = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const [dropdownForm] = Form.useForm();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [dropdownData, setDropdownData] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [typeColorMap, setTypeColorMap] = useState({});
  const [deleteTarget, setDeleteTarget] = useState({ key: '', value: '' });

  useEffect(() => {
    fetchEvents();
    axios.get('http://localhost:3001/dropdowns').then(res => {
      setDropdownData(res.data);
      setTypeColorMap(res.data.typeColors || {});
    });
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
  };

  const onDelete = async (event) => {
    const updated = events.filter(e => e.id !== event.id);
    setEvents(updated);
    setFilteredEvents(updated);
    await deleteEvent(event.id);
    message.success('Event deleted');
  };

  const dateCellRender = value => {
    const currentDate = value.format('YYYY-MM-DD');
    const dayEvents = filteredEvents.filter(e => dayjs(currentDate).isBetween(e.start, e.end, null, '[]'));
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayEvents.map((item) => {
          const color = typeColorMap[item.type] || '#595959';
          return (
            <Popconfirm
              key={item.id}
              title="Do you want to update or delete this event?"
              onConfirm={() => onDelete(item)}
              onCancel={() => onUpdate(item)}
              okText="Delete"
              cancelText="Update"
            >
              <li style={{ cursor: 'pointer', color }}>
                <strong>{item.name}</strong> - {item.type}
              </li>
            </Popconfirm>
          );
        })}
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
        <Button style={{ marginLeft: 8 }} onClick={() => {
          dropdownForm.setFieldsValue({ key: 'names', value: '', color: '' });
          setDropdownModalVisible(true);
        }}>Manage Dropdowns</Button>
      </div>
      <Calendar cellRender={dateCellRender} />

      {/* Ana Event Modal */}
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
          {['name', 'type', 'team', 'domain', 'location'].map(field => (
            <Form.Item key={field} name={field} label={field.charAt(0).toUpperCase() + field.slice(1)} rules={[{ required: true }]}>
              <Select>
                {dropdownData[field + 's'].map(val => <Option key={val} value={val}>{val}</Option>)}
              </Select>
            </Form.Item>
          ))}
          <Form.Item name="start" label="Start Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end" label="End Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Dropdown Yönetim Modalı */}
      <Modal
        title="Manage Dropdowns"
        open={dropdownModalVisible}
        onCancel={() => setDropdownModalVisible(false)}
        onOk={() => dropdownForm.submit()}
        okText="Add"
      >
        <hr />
        <h4>Add Dropdown Value</h4>
        <Form
          form={dropdownForm}
          layout="vertical"
          onFinish={async ({ key, value, color }) => {
            const newDropdown = { ...dropdownData };
            if (!newDropdown[key]) {
              message.error('Invalid dropdown key.');
              return;
            }
            if (newDropdown[key].includes(value)) {
              message.warning('This value already exists.');
              return;
            }
            newDropdown[key] = [...newDropdown[key], value];
            if (key === "types" && color) {
              newDropdown.typeColors = {
                ...newDropdown.typeColors,
                [value]: color
              };
            }
            try {
              await axios.patch('http://localhost:3001/dropdowns', newDropdown);
              setDropdownData(newDropdown);
              setTypeColorMap(newDropdown.typeColors || {});
              message.success('Dropdown updated');
              dropdownForm.resetFields();
              setDropdownModalVisible(false);
            } catch (err) {
              message.error('Update failed');
            }
          }}
        >
          <Form.Item name="key" label="Dropdown Key" rules={[{ required: true }]}>
            <Select placeholder="Select dropdown to update">
              <Option value="names">Names</Option>
              <Option value="types">Types</Option>
              <Option value="teams">Teams</Option>
              <Option value="domains">Domains</Option>
              <Option value="locations">Locations</Option>
            </Select>
          </Form.Item>
          <Form.Item name="value" label="New Value" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="color" label="Color (only for types)">
            <Input type="color" />
          </Form.Item>
        </Form>

        <hr />
        <h4>Delete Dropdown Value</h4>
        <Form layout="inline">
          <Form.Item label="Dropdown" required>
            <Select
              value={deleteTarget.key}
              onChange={key => setDeleteTarget(prev => ({ ...prev, key, value: '' }))}
              style={{ width: 150 }}
            >
              <Option value="names">Names</Option>
              <Option value="types">Types</Option>
              <Option value="teams">Teams</Option>
              <Option value="domains">Domains</Option>
              <Option value="locations">Locations</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Value" style={{ marginTop: 8 }} required>
            <Select
              value={deleteTarget.value}
              onChange={val => setDeleteTarget(prev => ({ ...prev, value: val }))}
              disabled={!deleteTarget.key}
              style={{ width: 180 }}
            >
              {dropdownData?.[deleteTarget.key]?.map(val => (
                <Option key={val} value={val}>{val}</Option>
              ))}
            </Select>
          </Form.Item>
          <Button
            style={{ marginTop: 8 }} 
            danger
            type="primary"
            disabled={!deleteTarget.key || !deleteTarget.value}
            onClick={async () => {
              const { key, value } = deleteTarget;
              const newDropdown = { ...dropdownData };
              newDropdown[key] = newDropdown[key].filter(v => v !== value);
              if (key === 'types' && newDropdown.typeColors) {
                delete newDropdown.typeColors[value];
              }
              try {
                await axios.patch('http://localhost:3001/dropdowns', newDropdown);
                setDropdownData(newDropdown);
                setTypeColorMap(newDropdown.typeColors || {});
                message.success('Value deleted');
                setDeleteTarget({ key: '', value: '' });
              } catch (err) {
                message.error('Failed to delete');
              }
            }}
          >
            Delete
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default App;