import React, { useEffect, useState } from 'react';
import { Calendar, Drawer, Form, Select, DatePicker, Button, Spin, message, Popconfirm, Input, Tag, List, Space, Divider, Empty, Modal, Dropdown, Menu, ConfigProvider } from 'antd';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Holidays from 'date-holidays';
import 'dayjs/locale/en-gb';
import locale from 'antd/es/locale/en_GB';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
const { Option } = Select;
const { RangePicker } = DatePicker;

const RemoteAPI = 'https://calendar-json-server-gof4.onrender.com/';
const LocalAPI = 'http://localhost:3001/';
const APIURL = LocalAPI;

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.locale('en-gb');

const App = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPersonMode, setEditPersonMode] = useState(false);
  const [form] = Form.useForm();
  const [dropdownForm] = Form.useForm();
  const [personForm] = Form.useForm();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [dropdownData, setDropdownData] = useState(null);
  const [people, setPeople] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [typeColorMap, setTypeColorMap] = useState({});
  const [deleteTarget, setDeleteTarget] = useState({ key: '', value: '' });
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordInputVisible, setPasswordInputVisible] = useState(false);
  const [peopleModalVisible, setPeopleModalVisible] = useState(false);
  const [personModalVisible, setPersonModalVisible] = useState(false);
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
  const [centralModalVisible, setCentralModalVisible] = useState(false);
  const [centralForm] = Form.useForm();
  const [centralEvents, setCentralEvents] = useState([]);
  const [centralEditMode, setCentralEditMode] = useState(false);
  const [selectedCentralId, setSelectedCentralId] = useState(null);
  const [holidays, setHolidays] = useState([]);

  const CENTRAL_COLOR = 'geekblue';
  const watchedStart = Form.useWatch('start', form);
  const watchedEnd   = Form.useWatch('end', form);
  const watchedUser  = Form.useWatch('user_id', form);

  useEffect(() => {
    fetchEvents();
    axios.get(APIURL + 'dropdowns').then(res => {
      setDropdownData(res.data);
      setTypeColorMap(res.data.typeColors || {});
      setHolidays([]);
      const result = res.data.locations.map(item => {
        const parts = item.split(" - ");
        return parts.slice(1);
      });
      let mergedHolidays = [];
      result.map(x => {
        mergedHolidays.push(mergeHolidays(x));
      });
      const combinedHolidays = mergedHolidays.flat();
      setHolidays(combinedHolidays);
    });
    axios.get(APIURL + 'people').then(res => {
      setPeople(res.data);
    });
    axios.get(APIURL + 'centeralEvents').then(res => setCentralEvents(res.data || []));
  }, []);

  const fetchEvents = async () => {
    const res = await axios.get(APIURL + 'events');
    setEvents(res.data);
    setFilteredEvents(res.data);
  };

  const createEvent = async (event) => {
    await axios.post(APIURL + 'events', event);
  };

  const updateEvent = async (id, event) => {
    await axios.put(APIURL + `events/${id}`, event);
  };

  const createPerson = async (people) => {
    await axios.post(APIURL + 'people', people);
  };

  const updatePerson = async (id, people) => {
    await axios.put(APIURL + `people/${id}`, people);
  };

  const deleteEvent = async (id) => {
    await axios.delete(APIURL + `events/${id}`);
  };

  const deletePeople = async (id) => {
    await axios.delete(APIURL + `people/${id}`);
  };

  const createCentral = async (payload) => {
    const { data } = await axios.post(APIURL + 'centeralEvents', payload);
    return data;
  };
  const updateCentral = async (id, payload) => {
    const { data } = await axios.put(APIURL + `centeralEvents/${id}`, payload);
    return data;
  };
  const deleteCentral = async (id) => {
    await axios.delete(APIURL + `centeralEvents/${id}`);
  };

  const hashString = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };

  const hslToHex = (h, s, l) => {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  };

  const getRegionColor = (region) => {
    if (!region) return '#595959';

    const h = hashString(region) % 360;
    const s = 65;
    const l = 55;
    const hex = hslToHex(h, s, l);
    return hex;
  };

  const mergeHolidays = (regions) => {
    const hd = new Holidays(...regions);
    const thisYear = dayjs().year();
    const holidayList = hd.getHolidays(thisYear).filter(h => String(h.type).toLowerCase() === 'public').map(h => ({
      id: `${h.date}-${h.name}`,
      name: h.name,
      start: dayjs(h.date).format('YYYY-MM-DD'),
      end: dayjs(h.date).format('YYYY-MM-DD'),
      region: regions.join('-')
    }));
    return holidayList;
  }

  const nameById = (id) => people.find(p => p.id === id)?.name || 'Unknown';

  const overlaps = (aStart, aEnd, bStart, bEnd) => {
    const s1 = dayjs(aStart).startOf('day');
    const e1 = dayjs(aEnd).startOf('day');
    const s2 = dayjs(bStart).startOf('day');
    const e2 = dayjs(bEnd).startOf('day');
    return s1.isSameOrBefore(e2, 'day') && e1.isSameOrAfter(s2, 'day');
  };

  const overlappingOthers = React.useMemo(() => {
    if (!watchedStart || !watchedEnd) return [];
    const s = watchedStart.format('YYYY-MM-DD');
    const e = watchedEnd.format('YYYY-MM-DD');
  
    return events
      .filter(ev => 
        overlaps(s, e, ev.start, ev.end) &&
        (!editMode || ev.id !== selectedEventId) && 
        (!watchedUser || ev.user_id !== watchedUser)
      )
      .sort((a,b) => dayjs(a.start).diff(dayjs(b.start)));
  }, [watchedStart, watchedEnd, watchedUser, events, editMode, selectedEventId]);

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

  const handleAddOrUpdatePerson = async values => {
    const newPerson = {
      id: editPersonMode && selectedPersonId ? selectedPersonId : uuidv4(),
      ...values,
      team: values.team,
      domain: values.domain,
      location: values.location,
    };

    let updatedPeople = [];

    if (editPersonMode && selectedPersonId) {
      updatedPeople = people.map(e => (e.id === selectedPersonId ? newPerson : e));
      message.success('Person updated');
    } else {
      updatedPeople = [...people, newPerson];
      message.success('Person added');
    }

    setPeople(updatedPeople);

    if (editPersonMode && selectedPersonId) {
      await updatePerson(selectedPersonId, newPerson);
    } else {
      await createPerson(newPerson);
    }

    setPersonModalVisible(false);
    personForm.resetFields();
    setEditPersonMode(false);
    setSelectedPersonId(null);
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

  const onUpdatePerson = (event) => {
    personForm.setFieldsValue({
      ...event,
      start: dayjs(event.start),
      end: dayjs(event.end)
    });
    setPersonModalVisible(true);
    setEditPersonMode(true);
    setSelectedPersonId(event.id);
  };

  const onDelete = async (event) => {
    const updated = events.filter(e => e.id !== event.id);
    setEvents(updated);
    applyFilters(updated, filters);
    await deleteEvent(event.id);
    message.success('Event deleted');
  };

  const onDeletePerson = async (event) => {
    const updated = people.filter(e => e.id !== event.id);
    setPeople(updated);
    await deletePeople(event.id);
    message.success('Person deleted');
  };

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    applyFilters(events, updated);
  };

  const inMulti = (arr, val) => !arr || arr.length === 0 || arr.includes(val);

  const applyFilters = (allEvents, filterObj) => {
    const filtered = allEvents.filter(event => {
      const teamVal = people.filter(x => x.id === event.user_id)[0].team;
      const domainVal = people.filter(x => x.id === event.user_id)[0].domain;
      const locationVal = people.filter(x => x.id === event.user_id)[0].location;
  
      return (
        inMulti(filterObj.person, event.user_id) &&
        inMulti(filterObj.type, event.type) &&
        inMulti(filterObj.team, teamVal) &&
        inMulti(filterObj.domain, domainVal) &&
        inMulti(filterObj.location, locationVal) &&
        (!filterObj.dateRange || (
          dayjs(event.start).isSameOrBefore(filterObj.dateRange[1], 'day') && dayjs(event.end).isSameOrAfter(filterObj.dateRange[0], 'day')
        ))
      );
    });
  
    setFilteredEvents(filtered);
  };

  const dateCellRender = value => {
    const currentDate = value.format('YYYY-MM-DD');
  
    const dayEvents = filteredEvents.filter(e =>
      dayjs(currentDate).isBetween(e.start, e.end, null, '[]')
    );
  
    const dayCentral = centralEvents.filter(e =>
      dayjs(currentDate).isBetween(e.start, e.end, null, '[]')
    );

    const dayHolidays = holidays.filter(e =>
      dayjs(currentDate).isBetween(e.start, e.end, null, '[]')
    );
  
    if (dayEvents.length === 0 && dayCentral.length === 0 && dayHolidays.length === 0) return null;
  
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayHolidays.map(item => (
          <li key={`holiday-${item.id}`} style={{ cursor: 'default' }}>
            <Tag color={getRegionColor(item.region)} style={{ marginLeft: 4, marginTop: 4 }}>
              [{item.region}] {item.name}
            </Tag>
          </li>
        ))}

        {dayCentral.map(item => (
          <li key={`central-${item.id}`} style={{ cursor: 'default' }}>
            <Tag color={CENTRAL_COLOR} style={{ marginLeft: 4, marginTop: 4 }}>
              [Central Event] {item.name}
            </Tag>
          </li>
        ))}
  
        {dayEvents.map(item => {
          const color = typeColorMap[item.type] || '#595959';
          return (
            <Popconfirm
              key={item.id}
              title={`Do you want to update or delete ${people.find(x => x.id === item.user_id)?.name} ${item.type}?`}
              onConfirm={() => onDelete(item)}
              onCancel={() => onUpdate(item)}
              okText="Delete"
              cancelText="Update"
            >
              <li style={{ cursor: 'pointer' }}>
                <Tag color={color} style={{ marginLeft: 4, marginTop: 4 }}>
                  {people.find(x => x.id === item.user_id)?.name} {' '} {item.type}
                </Tag>
              </li>
            </Popconfirm>
          );
        })}
      </ul>
    );
  };  

  const isWeekend = (d) => d.day() === 0 || d.day() === 6;

  const businessDaysBetween = (start, end, holidaysSet = new Set()) => {
    let cur = dayjs(start).startOf('day');
    const last = dayjs(end).startOf('day');
    let count = 0;

    while (cur.isSameOrBefore(last, 'day')) {
      const key = cur.format('YYYY-MM-DD');
      if (!isWeekend(cur) && !holidaysSet.has(key)) count++;
      cur = cur.add(1, 'day');
    }
    return count;
  };

  const calculateStatistics = () => {
    const statsMap = {}; 
    events.forEach(event => {
      const person = people.find(x => x.id === event.user_id);
      if (!!!person) {
        return;
      }
      const name = person.name || 'Unknown';
      const person_region = person.location;
      const result = [person_region].map(item => {
        const parts = item.split(" - ");
        return parts.slice(1);
      });
      const holidaysSet = new Set(mergeHolidays(result.flat()).map(h => dayjs(h.start).format('YYYY-MM-DD')));
      const days = businessDaysBetween(event.start, event.end, holidaysSet);

      if (!statsMap[name]) {
        statsMap[name] = {
          totalDays: 0,
          types: {},
          lastDate: dayjs(event.end).format('DD.MM.YYYY'),
        };
      }
  
      statsMap[name].totalDays += days;
  
      if (!statsMap[name].types[event.type]) {
        statsMap[name].types[event.type] = 0;
      }
      statsMap[name].types[event.type] += days;
  
      if (dayjs(event.end).isAfter(dayjs(statsMap[name].lastDate))) {
        statsMap[name].lastDate = event.end;
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

  const adminMenu = (
    <Menu
      items={[
        {
          key: 'manage-dropdowns',
          label: 'Manage Dropdowns',
          onClick: () => {
            setDropdownModalVisible(true);
            dropdownForm.setFieldsValue({ key: 'types', value: '', color: '' });
          },
        },
        {
          key: 'manage-people',
          label: 'Manage People',
          onClick: () => setPeopleModalVisible(true),
        },
        {
          key: 'manage-central',
          label: 'Manage Central Events',
          onClick: () => setCentralModalVisible(true),
        },
      ]}
    />
  );

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
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 0 }}>
          <Select mode="multiple" placeholder="Person" allowClear style={{ width: 150 }} onChange={(val) => handleFilterChange('person', val)}>
            {people.map(val => <Option key={val.id} value={val.id}>{val.name}</Option>)}
          </Select>
          <Select mode="multiple" placeholder="Type" allowClear style={{ width: 150 }} onChange={(val) => handleFilterChange('type', val)}>
            {dropdownData.types.map(val => <Option key={val} value={val}>{val}</Option>)}
          </Select>
          <Select mode="multiple" placeholder="Team" allowClear style={{ width: 150 }} onChange={(val) => handleFilterChange('team', val)}>
            {dropdownData.teams.map(val => <Option key={val} value={val}>{val}</Option>)}
          </Select>
          <Select mode="multiple" placeholder="Domain" allowClear style={{ width: 150 }} onChange={(val) => handleFilterChange('domain', val)}>
            {dropdownData.domains.map(val => <Option key={val} value={val}>{val}</Option>)}
          </Select>
          <Select mode="multiple" placeholder="Location" allowClear style={{ width: 150 }} onChange={(val) => handleFilterChange('location', val)}>
            {dropdownData.locations.map(val => <Option key={val} value={val}>{val}</Option>)}
          </Select>
          <RangePicker onChange={(range) => handleFilterChange('dateRange', range)} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 0 }}>
          <Button onClick={calculateStatistics}>Show Statistics</Button>
          {
            isPasswordVerified ? 
            (
              <Dropdown overlay={adminMenu} placement="bottomRight">
                <Button type="primary">
                  Admin Actions <UnlockOutlined />
                </Button>
              </Dropdown>
            ) : (
              <Button type="primary" onClick={() => { setPasswordInputVisible(true); }} icon={<LockOutlined />}>
                Admin Login
              </Button>
            )
          }
          <Button type="primary" onClick={() => setModalVisible(true)}>Add New Entry</Button>
        </div>
      </div>

      <ConfigProvider locale={locale}>
        <Calendar cellRender={dateCellRender} />
      </ConfigProvider>

      <Drawer
        width={800}
        title={editMode ? "Update Event" : "Add New Holiday"}
        open={modalVisible}
        onClose={() => {
          setModalVisible(false);
          form.resetFields();
          setEditMode(false);
        }}
        extra={
          <Space>
            <Button onClick={() => {
              setModalVisible(false);
              form.resetFields();
              setEditMode(false);
            }}>Cancel</Button>
            <Button onClick={() => form.submit()} type="primary">
              Submit
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrUpdate}>
          <Form.Item key={'user_id'} name={'user_id'} label={'Person'} rules={[{ required: true }]}>
            <Select>
              {people.map(val => <Option key={val.id} value={val.id}>{val.name}</Option>)}
            </Select>
          </Form.Item>
          {['type'].map(field => (
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
          {(watchedStart && watchedEnd) && (
            <>
              <Divider />
              <h4>Others on leave in this range</h4>
              {overlappingOthers.length === 0 ? (
                <Empty description="No overlaps found" />
              ) : (
                <List
                  size="small"
                  dataSource={overlappingOthers}
                  renderItem={(item) => (
                    <List.Item>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <Tag color={typeColorMap[item.type] || 'default'}>{item.type}</Tag>
                        <strong>{nameById(item.user_id)}</strong>
                        <span>({item.start} → {item.end})</span>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </>
          )}
        </Form>
      </Drawer>

      <Drawer
        width={800}
        title={editPersonMode ? "Update Person" : "Add New Person"}
        open={personModalVisible}
        onClose={() => {
          setPersonModalVisible(false);
          personForm.resetFields();
          setEditPersonMode(false);
        }}
        extra={
          <Space>
            <Button onClick={() => {
              setPersonModalVisible(false);
              personForm.resetFields();
              setEditPersonMode(false);
            }}>Cancel</Button>
            <Button onClick={() => personForm.submit()} type="primary">
              Submit
            </Button>
          </Space>
        }
      >
        <Form form={personForm} layout="vertical" onFinish={handleAddOrUpdatePerson}>
          <Form.Item key={'name'} name={'name'} label={'Name'} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {['team', 'domain', 'location'].map(field => (
            <Form.Item key={field} name={field} label={field.charAt(0).toUpperCase() + field.slice(1)} rules={[{ required: true }]}>
              <Select>
                {dropdownData[field + 's']?.map(val => <Option key={val} value={val}>{val}</Option>)}
              </Select>
            </Form.Item>
          ))}
        </Form>
      </Drawer>

      <Drawer
        width={800}
        title="Manage Dropdowns"
        open={dropdownModalVisible}
        onClose={() => setDropdownModalVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setDropdownModalVisible(false)}>Cancel</Button>
            <Button onClick={() => dropdownForm.submit()} type="primary">
              Add
            </Button>
          </Space>
        }
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
              await axios.patch( APIURL + 'dropdowns', newDropdown);
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
              <Option value="types">Types</Option>
              <Option value="teams">Teams</Option>
              <Option value="domains">Domains</Option>
              <Option value="locations">Locations</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Value" required>
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
                await axios.patch(APIURL + 'dropdowns', newDropdown);
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
      </Drawer>
      <Drawer
        title="People"
        open={peopleModalVisible}
        onClose={() => setPeopleModalVisible(false)}
        footer={null}
        width={800}
        extra={
          <Space>
            <Button onClick={() => setPersonModalVisible(true)} type="primary">
              Add New Person
            </Button>
          </Space>
        }
      >
        <List
          dataSource={people}
          renderItem={(item) => (
            <List.Item
              actions={[
                <a key="edit" onClick={() => {
                  onUpdatePerson(item);
                  setPeopleModalVisible(false);
                }}>Edit</a>,
                <a key="delete" onClick={() => {
                  onDeletePerson(item);
                  setPeopleModalVisible(false);
                }}>Delete</a>
              ]}
            >
              <Tag color={'#595959'}>{item.location}</Tag>
              <strong style={{ marginLeft: 8 }}>{item.name}</strong> ({item.team} - {item.domain})
            </List.Item>
          )}
        />
      </Drawer>
      <Drawer
        title="Leave Statistics"
        open={statsModalVisible}
        onClose={() => setStatsModalVisible(false)}
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
      </Drawer>
      <Modal
        title="Enter Admin Password"
        open={passwordInputVisible}
        onCancel={() => {
          setPasswordInputVisible(false);
          setPasswordInput('');
        }}
        onOk={async () => {
          try {
            const res = await axios.get(APIURL + 'password');
            if (res.data.value === passwordInput) {
              setPasswordInputVisible(false);
              setIsPasswordVerified(true);
              setPasswordInput('');
              dropdownForm.setFieldsValue({ key: 'types', value: '', color: '' });
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

      <Drawer
        width={700}
        title={centralEditMode ? "Update Central Event" : "Add Central Event"}
        open={centralModalVisible}
        onClose={() => {
          setCentralModalVisible(false);
          centralForm.resetFields();
          setCentralEditMode(false);
          setSelectedCentralId(null);
        }}
        extra={
          <Space>
            <Button onClick={() => {
              setCentralModalVisible(false);
              centralForm.resetFields();
              setCentralEditMode(false);
              setSelectedCentralId(null);
            }}>Cancel</Button>
            <Button onClick={() => centralForm.submit()} type="primary">Save</Button>
          </Space>
        }
      >
        <Form
          form={centralForm}
          layout="vertical"
          onFinish={async (vals) => {
            const payload = {
              id: centralEditMode && selectedCentralId ? selectedCentralId : uuidv4(),
              name: vals.name,
              start: vals.start.format('YYYY-MM-DD'),
              end: vals.end.format('YYYY-MM-DD'),
            };

            try {
              if (centralEditMode && selectedCentralId) {
                await updateCentral(selectedCentralId, payload);
                setCentralEvents(prev => prev.map(e => e.id === selectedCentralId ? payload : e));
                message.success('Central event updated');
              } else {
                await createCentral(payload);
                setCentralEvents(prev => [...prev, payload]);
                message.success('Central event added');
              }
              centralForm.resetFields();
              setCentralModalVisible(false);
              setCentralEditMode(false);
              setSelectedCentralId(null);
            } catch (e) {
              message.error('Operation failed');
            }
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="start" label="Start" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end" label="End" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>

        <Divider />
        <h4>Central Events</h4>
        <List
          dataSource={centralEvents.sort((a,b) => dayjs(a.start).diff(dayjs(b.start)))}
          renderItem={(item) => (
            <List.Item
              actions={[
                <a key="edit" onClick={() => {
                  centralForm.setFieldsValue({
                    name: item.name,
                    start: dayjs(item.start),
                    end: dayjs(item.end),
                  });
                  setCentralEditMode(true);
                  setSelectedCentralId(item.id);
                  setCentralModalVisible(true);
                }}>Edit</a>,
                <a key="delete" onClick={async () => {
                  await deleteCentral(item.id);
                  setCentralEvents(prev => prev.filter(e => e.id !== item.id));
                  message.success('Deleted');
                }}>Delete</a>
              ]}
            >
              <Tag color={CENTRAL_COLOR}>Central</Tag>
              <strong style={{ marginLeft: 8 }}>{item.name}</strong> ({item.start} → {item.end})
            </List.Item>
          )}
        />
      </Drawer>

    </div>
  );
};

export default App;