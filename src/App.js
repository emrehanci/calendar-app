import React, { useEffect, useState } from 'react';
import { Calendar, Modal, Form, Select, DatePicker, Button, Spin } from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);
const { Option } = Select;

const App = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filters, setFilters] = useState({});
  const [dropdownData, setDropdownData] = useState(null);

  useEffect(() => {
    axios.get('/events.json').then(res => {
      setEvents(res.data);
      setFilteredEvents(res.data);
    });

    axios.get('/dropdowns.json').then(res => setDropdownData(res.data));
  }, []);

  const handleAdd = values => {
    const newEvent = {
      ...values,
      start: values.start.format('YYYY-MM-DD'),
      end: values.end.format('YYYY-MM-DD'),
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    setFilteredEvents(updatedEvents);
    setModalVisible(false);
    form.resetFields();
  };

  const handleFilter = person => {
    setFilteredEvents(events.filter(e => e.name === person));
  };

  const dateCellRender = value => {
    const currentDate = value.format('YYYY-MM-DD');
    const dayEvents = filteredEvents.filter(e => dayjs(currentDate).isBetween(e.start, e.end, null, '[]'));
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {dayEvents.map((item, idx) => (
          <li key={idx}><strong>{item.name}</strong> - {item.type}</li>
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
      <Calendar dateCellRender={dateCellRender} />

      <Modal
        title="Add New Holiday"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Submit"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
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
