import React, { useEffect, useState } from 'react';
import {
  Calendar, Modal, Form, Select, DatePicker, Button, Spin, message, Popconfirm, Input, Tag, List
} from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const { Option } = Select;
const { RangePicker } = DatePicker;

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

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
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordInputVisible, setPasswordInputVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [statistics, setStatistics] = useState([]);
  const [filters, setFilters] = useState({
    name: null,
    type: null,
    team: null,
    domain: null,
    location: null,
    dateRange: null
  });

  useEffect(() => {
    fetchEvents();
    axios.get('https://calendar-json-server-gof4.onrender.com//dropdowns').then(res => {
      setDropdownData(res.data);
      setTypeColorMap(res.data.typeColors || {});
    });
  }, []);

  const fetchEvents = async () => {
    const res = await axios.get('https://calendar-json-server-gof4.onrender.com//events');
    setEvents(res.data);
    setFilteredEvents(res.data);
  };

  const createEvent = async (event) => {
    await axios.post('https://calendar-json-server-gof4.onrender.com//events', event);
  };

  const updateEvent = async (id, event) => {
    await axios.put(`https://calendar-json-server-gof4.onrender.com//events/${id}`, event);
  };

  const deleteEvent = async (id) => {
    await axios.delete(`https://calendar-json-server-gof4.onrender.com//events/${id}`);
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
    applyFilters(updatedEvents, filters);

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
    applyFilters(updated, filters);
    await deleteEvent(event.id);
    message.success('Event deleted');
  };

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    applyFilters(events, updated);
  };

  const applyFilters = (allEvents, filterObj) => {
    const filtered = allEvents.filter(event => {
      return (!filterObj.name || event.name === filterObj.name) &&
             (!filterObj.type || event.type === filterObj.type) &&
             (!filterObj.team || event.team === filterObj.team) &&
             (!filterObj.domain || event.domain === filterObj.domain) &&
             (!filterObj.location || event.location === filterObj.location) &&
             (!filterObj.dateRange || (
                dayjs(event.start).isSameOrAfter(filterObj.dateRange[0], 'day') &&
                dayjs(event.end).isSameOrBefore(filterObj.dateRange[1], 'day')
             ));
    });
    setFilteredEvents(filtered);
  };

  const dateCellRender = value => {
    const currentDate = value.format('YYYY-MM-DD');
    const dayEvents = filteredEvents.filter(e => dayjs(currentDate).isBetween(e.start, e.end, null, '[]'));
  
    if (dayEvents.length === 0) return null;
  
    if (dayEvents.length > 2) {
      return (
        <div onClick={() => {
          setSelectedDayEvents(dayEvents);
          setDayModalVisible(true);
        }} style={{ cursor: 'pointer', color: '#1890ff', textAlign: 'center' }}>
          {dayEvents.length}+ events
        </div>
      );
    }
  
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
              <li style={{ cursor: 'pointer' }}>
                <Tag color={color} style={{ marginLeft: 4, marginTop: 4 }}>{item.name} {''} {item.type}</Tag>
              </li>
            </Popconfirm>
          );
        })}
      </ul>
    );
  };  

  const calculateStatistics = () => {
    const statsMap = {};
  
    events.forEach(event => {
      const days = dayjs(event.end).diff(dayjs(event.start), 'day') + 1;
  
      if (!statsMap[event.name]) {
        statsMap[event.name] = {
          totalDays: 0,
          types: {},
          lastDate: event.end,
        };
      }
  
      statsMap[event.name].totalDays += days;
  
      if (!statsMap[event.name].types[event.type]) {
        statsMap[event.name].types[event.type] = 0;
      }
  
      statsMap[event.name].types[event.type] += days;
  
      if (dayjs(event.end).isAfter(dayjs(statsMap[event.name].lastDate))) {
        statsMap[event.name].lastDate = event.end;
      }
    });
  
    const statList = Object.entries(statsMap).map(([name, data]) => ({
      name,
      totalDays: data.totalDays,
      types: data.types,
      lastDate: data.lastDate,
    }));
  
    setStatistics(statList);
    setStatsModalVisible(true);
  };  

  if (!dropdownData) {
    return <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
      <Spin size="large" />
    </div>;
  }

  return (
    <div style={{ padding: 24, paddingTop: 0 }}>
      <h2>CoCo Calendar</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Select placeholder="Name" allowClear style={{ width: 150 }} onChange={(val) => handleFilterChange('name', val)}>
          {dropdownData.names.map(val => <Option key={val} value={val}>{val}</Option>)}
        </Select>
        <Select placeholder="Type" allowClear style={{ width: 150 }} onChange={(val) => handleFilterChange('type', val)}>
          {dropdownData.types.map(val => <Option key={val} value={val}>{val}</Option>)}
        </Select>
        <Select placeholder="Team" allowClear style={{ width: 150 }} onChange={(val) => handleFilterChange('team', val)}>
          {dropdownData.teams.map(val => <Option key={val} value={val}>{val}</Option>)}
        </Select>
        <Select placeholder="Domain" allowClear style={{ width: 150 }} onChange={(val) => handleFilterChange('domain', val)}>
          {dropdownData.domains.map(val => <Option key={val} value={val}>{val}</Option>)}
        </Select>
        <Select placeholder="Location" allowClear style={{ width: 150 }} onChange={(val) => handleFilterChange('location', val)}>
          {dropdownData.locations.map(val => <Option key={val} value={val}>{val}</Option>)}
        </Select>
        <RangePicker onChange={(range) => handleFilterChange('dateRange', range)} />
        <Button
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            setPasswordInputVisible(true);
          }}
        >
          Manage Dropdowns
        </Button>
        <Button onClick={calculateStatistics}>Show Statistics</Button>
        <Button type="primary" onClick={() => setModalVisible(true)}>Add New Entry</Button>
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
              await axios.patch('https://calendar-json-server-gof4.onrender.com//dropdowns', newDropdown);
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
                await axios.patch('https://calendar-json-server-gof4.onrender.com//dropdowns', newDropdown);
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
      <Modal
        title="Events on this day"
        open={dayModalVisible}
        onCancel={() => setDayModalVisible(false)}
        footer={null}
        width={800}
      >
        <List
          dataSource={selectedDayEvents}
          renderItem={(item) => (
            <List.Item
              actions={[
                <a key="edit" onClick={() => {
                  onUpdate(item);
                  setDayModalVisible(false);
                }}>Edit</a>,
                <a key="delete" onClick={() => {
                  onDelete(item);
                  setDayModalVisible(false);
                }}>Delete</a>
              ]}
            >
              <Tag color={typeColorMap[item.type] || '#595959'}>{item.type}</Tag>
              <strong style={{ marginLeft: 8 }}>{item.name}</strong> ({item.start} → {item.end})
            </List.Item>
          )}
        />
      </Modal>
      <Modal
        title="Leave Statistics"
        open={statsModalVisible}
        onCancel={() => setStatsModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={statistics}
          renderItem={item => (
            <List.Item>
              <div style={{ width: '100%' }}>
                <h4>{item.name}</h4>
                <p><strong>Total Days:</strong> {item.totalDays}</p>
                <p><strong>Last Leave:</strong> {item.lastDate}</p>
                <div>
                  {Object.entries(item.types).map(([type, count]) => (
                    <Tag key={type} color={typeColorMap[type] || 'default'}>
                      {type}: {count} day(s)
                    </Tag>
                  ))}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Modal>
      <Modal
        title="Enter Admin Password"
        open={passwordInputVisible}
        onCancel={() => {
          setPasswordInputVisible(false);
          setPasswordInput('');
        }}
        onOk={async () => {
          try {
            const res = await axios.get('https://calendar-json-server-gof4.onrender.com//password');
            if (res.data.value === passwordInput) {
              setPasswordInputVisible(false);
              setIsPasswordVerified(true);
              setDropdownModalVisible(true);
              setPasswordInput('');
              dropdownForm.setFieldsValue({ key: 'names', value: '', color: '' });
            } else {
              message.error('Incorrect password');
            }
          } catch {
            message.error('Failed to verify password');
          }
        }}
        okText="Verify"
      >
        <Input.Password
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Enter password"
        />
      </Modal>

    </div>
  );
};

export default App;