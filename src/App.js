import React, { useEffect, useState } from 'react';
import { Calendar, Drawer, Form, Select, DatePicker, Button, Spin, message, Popconfirm, Input, Tag, List, Space, Divider, Empty, Modal, Dropdown, Menu, Radio, Popover, Collapse, InputNumber, Tabs } from 'antd';
import { LockOutlined, UnlockOutlined, LeftOutlined, RightOutlined, FilterOutlined, CalendarOutlined, AreaChartOutlined, PlusOutlined, SunOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined, BgColorsOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Holidays from 'date-holidays';
const { Option } = Select;
const { RangePicker } = DatePicker;

const RemoteAPI = 'https://calendar-json-server-gof4.onrender.com/';
const LocalAPI = 'http://localhost:3001/';
const APIURL = RemoteAPI;

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

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
  const [open, setOpen] = useState(false);
  const [allEventsOpen, setAllEventsOpen] = useState(false);
  const [eventsSearch, setEventsSearch] = useState('');
  const [bulkCentralOpen, setBulkCentralOpen] = useState(false);
  const [bulkCentralText, setBulkCentralText] = useState('');
  const [bulkCentralPreview, setBulkCentralPreview] = useState([]);
  const [bulkCentralErrors, setBulkCentralErrors] = useState([]);
  const [bulkEventsOpen, setBulkEventsOpen] = useState(false);
  const [bulkEventsText, setBulkEventsText] = useState('');
  const [bulkEventsPreview, setBulkEventsPreview] = useState([]);
  const [bulkEventsErrors, setBulkEventsErrors] = useState([]);

  const countTypeUsage = (type) => events.filter(e => e.type === type).length;
  const countTeamUsage = (team) => people.filter(p => p.team === team).length;
  const countDomainUsage = (domain) => people.filter(p => p.domain === domain).length;
  const countLocationUsage = (location) => people.filter(p => p.location === location).length;

  const ensureUniqueSorted = (arr) => Array.from(new Set(arr)).sort((a,b) => String(a).localeCompare(String(b)));


  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
  };

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

  const parseEventsPaste = (text, people, validTypes = []) => {
    const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
    const preview = [];
    const errors = [];

    if (!lines.length) return { preview, errors };

    const hasHeader =
      /name/i.test(lines[0]) &&
      (/type/i.test(lines[0]) || /kind/i.test(lines[0])) &&
      (/start/i.test(lines[0]) || /from/i.test(lines[0]));

    const startIdx = hasHeader ? 1 : 0;

    const byName = new Map(people.map(p => [p.name?.trim().toLowerCase(), p]));
    const typeSet = new Set(validTypes || []);

    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split('\t').map(c => (c ?? '').trim());
      const [nameRaw, typeRaw, startRaw, endRaw] = [
        cols[0] ?? '', cols[1] ?? '', cols[2] ?? '', cols[3] ?? ''
      ];

      if (!nameRaw && !typeRaw && !startRaw && !endRaw) continue;

      if (!nameRaw || !typeRaw || !startRaw) {
        errors.push({ line: i + 1, reason: 'Name, Type and Start are required.' });
        continue;
      }

      const person = byName.get(nameRaw.toLowerCase());
      if (!person) {
        errors.push({ line: i + 1, reason: `No person found for name: "${nameRaw}"` });
        continue;
      }

      const start = parseDateLoose(startRaw);
      const end   = parseDateLoose(endRaw || startRaw);
      if (!start || !end) {
        errors.push({ line: i + 1, reason: 'Invalid date(s).' });
        continue;
      }
      if (end.isBefore(start, 'day')) {
        errors.push({ line: i + 1, reason: 'End cannot be before Start.' });
        continue;
      }

      if (typeSet.size && !typeSet.has(typeRaw)) {
        errors.push({ line: i + 1, reason: `Unknown type "${typeRaw}" (not in dropdown types)` });
      }

      preview.push({
        id: uuidv4(),
        user_id: person.id,
        type: typeRaw,
        start: start.startOf('day').format('YYYY-MM-DD'),
        end:   end.startOf('day').format('YYYY-MM-DD'),
        __displayName: person.name,
      });
    }

    const uniq = [];
    const seen = new Set();
    for (const p of preview) {
      const key = `${p.user_id}__${p.type}__${p.start}__${p.end}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(p);
      }
    }
    return { preview: uniq, errors };
  };


  const parseDateLoose = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return null;
    const tryFormats = [
      'YYYY-MM-DD', 'DD.MM.YYYY', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD',
      'D.M.YYYY', 'D/M/YYYY', 'YYYY.M.D', 'YYYY/M/D'
    ];
    for (const fmt of tryFormats) {
      const d = dayjs(s, fmt, true);
      if (d.isValid()) return d;
    }
    const dIso = dayjs(s);
    return dIso.isValid() ? dIso : null;
  };

  const parseCentralPaste = (text) => {
    const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
    const preview = [];
    const errors = [];

    if (!lines.length) return { preview, errors };

    const looksLikeHeader = /name/i.test(lines[0]) && (/start/i.test(lines[0]) || /from/i.test(lines[0]));
    const startIdx = looksLikeHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const row = lines[i].split('\t');
      const [nameRaw, startRaw, endRaw] = row.map(c => (c ?? '').trim());
      if (!nameRaw && !startRaw && !endRaw) continue;

      if (!nameRaw || !startRaw) {
        errors.push({ line: i + 1, reason: 'Name or Start date is empty.' });
        continue;
      }

      const start = parseDateLoose(startRaw);
      const end   = parseDateLoose(endRaw || startRaw);
      if (!start || !end) {
        errors.push({ line: i + 1, reason: 'Dates are invalid.' });
        continue;
      }

      const s = start.startOf('day');
      const e = end.startOf('day');
      if (e.isBefore(s, 'day')) {
        errors.push({ line: i + 1, reason: 'End date can not be earlier then start date' });
        continue;
      }

      preview.push({
        id: uuidv4(),
        name: nameRaw,
        start: s.format('YYYY-MM-DD'),
        end:   e.format('YYYY-MM-DD'),
      });
    }

    const uniq = [];
    const seen = new Set();
    for (const p of preview) {
      const key = `${p.name}__${p.start}__${p.end}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(p);
      }
    }

    return { preview: uniq, errors };
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

  const allEventsData = React.useMemo(() => {
    const q = (eventsSearch || '').toLowerCase();
    return events
      .slice()
      .sort((a, b) => dayjs(a.start).diff(dayjs(b.start)))
      .filter(ev => {
        const person = nameById(ev.user_id);
        const haystack = `${person} ${ev.type} ${ev.start} ${ev.end}`.toLowerCase();
        return !q || haystack.includes(q);
      });
  }, [events, eventsSearch, people]);

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
        {
          key: 'bulk-events',
          label: 'Bulk Import Events',
          onClick: () => {
            setBulkEventsText('');
            setBulkEventsPreview([]);
            setBulkEventsErrors([]);
            setBulkEventsOpen(true);
          },
        }
      ]}
    />
  );

  const FiltersPopover = () => {
    const content = (
      <div style={{ width: 500 }}>
        <Select mode="multiple" placeholder="Person" value={filters.person || []} allowClear style={{ width: '100%', marginBottom: 8 }} onChange={(val) => handleFilterChange('person', val)}>
          {people.map(val => (<Option key={val.id} value={val.id}>{val.name}</Option>))}
        </Select>
        <Select mode="multiple" placeholder="Type" value={filters.type || []} allowClear style={{ width: '100%', marginBottom: 8 }}onChange={(val) => handleFilterChange('type', val)}>
          {dropdownData.types.map(val => (<Option key={val} value={val}>{val}</Option>))}
        </Select>
        <Select mode="multiple" placeholder="Team" value={filters.team || []} allowClear style={{ width: '100%', marginBottom: 8 }} onChange={(val) => handleFilterChange('team', val)}>
          {dropdownData.teams.map(val => (<Option key={val} value={val}>{val}</Option>))}
        </Select>
        <Select mode="multiple" placeholder="Domain" value={filters.domain || []} allowClear style={{ width: '100%', marginBottom: 8 }} onChange={(val) => handleFilterChange('domain', val)}>
          {dropdownData.domains.map(val => (<Option key={val} value={val}>{val}</Option>))}
        </Select>
        <Select mode="multiple" placeholder="Location" value={filters.location || []} allowClear style={{ width: '100%', marginBottom: 8 }} onChange={(val) => handleFilterChange('location', val)}>
          {dropdownData.locations.map(val => (<Option key={val} value={val}>{val}</Option>))}
        </Select>
        <RangePicker style={{ width: '100%' }} value={filters.dateRange || null} onChange={(range) => handleFilterChange('dateRange', range)} />
      </div>
    );
  
    return (
      <Popover content={content} title="Filters" trigger="click" placement="bottomLeft" open={open} onOpenChange={handleOpenChange} destroyTooltipOnHide={false}>
        <Button icon={<FilterOutlined />} iconPosition='end'>Filters</Button>
      </Popover>
    );
  }

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
      <Calendar cellRender={dateCellRender} showWeek
      headerRender={({ value, type, onChange, onTypeChange }) => {
        const year = value.year();
        const month = value.month();

        const yearOptions = Array.from({ length: 20 }, (_, i) => {
          const label = year - 10 + i;
          return { label, value: label };
        });

        const monthOptions = value
          .localeData()
          .monthsShort()
          .map((label, index) => ({
            label,
            value: index,
          }));

        const goPrev = () => {
          const unit = type === 'year' ? 'year' : 'month';
          onChange(value.clone().subtract(1, unit));
        };
    
        const goNext = () => {
          const unit = type === 'year' ? 'year' : 'month';
          onChange(value.clone().add(1, unit));
        };
    
        const goToday = () => {
          onChange(dayjs());
        };

        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 0 }}>
              <FiltersPopover />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 0 }}>
              <Button onClick={() => setAllEventsOpen(true)} icon={<SunOutlined />} iconPosition='end'>All Events</Button>
              <Button onClick={calculateStatistics} icon={<AreaChartOutlined />} iconPosition='end'>Show Statistics</Button>
              {
                isPasswordVerified ? 
                (
                  <Dropdown overlay={adminMenu} placement="bottomRight">
                    <Button type="primary" icon={<UnlockOutlined />} iconPosition='end'>Admin Actions</Button>
                  </Dropdown>
                ) : (
                  <Button type="primary" onClick={() => { setPasswordInputVisible(true); }} icon={<LockOutlined />} iconPosition='end'>Admin Login</Button>
                )
              }
              <Button type="primary" onClick={() => setModalVisible(true)} icon={<PlusOutlined />} iconPosition='end'>Add New Event</Button>
              <Button type="default" onClick={goPrev} icon={<LeftOutlined />} />
              <Radio.Group onChange={(e) => onTypeChange(e.target.value)} value={type}>
                <Radio.Button value="month">Month</Radio.Button>
                <Radio.Button value="year">Year</Radio.Button>
              </Radio.Group>
              <Select popupMatchSelectWidth={false} value={year} options={yearOptions} onChange={(newYear) => { const now = value.clone().year(newYear); onChange(now); }} />
              <Select popupMatchSelectWidth={false} value={month} options={monthOptions} onChange={(newMonth) => { const now = value.clone().month(newMonth); onChange(now); }}/>
              <Button type="default" onClick={goNext} icon={<RightOutlined />} />
              <Button onClick={goToday} icon={<CalendarOutlined />} iconPosition='end'>Today</Button>
            </div>
          </div>
        );
      }}
      />

      <Drawer
        width={800}
        title={editMode ? "Update Event" : "Add New Event"}
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
        footer={null}
      >
        <Tabs
          defaultActiveKey="types"
          items={[
            {
              key: 'types',
              label: 'Types',
              children: (
                <DropdownManager
                  kind="types"
                  values={dropdownData.types}
                  colorMap={dropdownData.typeColors || {}}
                  onPatch={async (nextValues, nextColorMap) => {
                    const payload = {
                      ...dropdownData,
                      types: ensureUniqueSorted(nextValues),
                      typeColors: nextColorMap,
                    };
                    await axios.patch(APIURL + 'dropdowns', payload);
                    setDropdownData(payload);
                    setTypeColorMap(payload.typeColors || {});
                    message.success('Types updated');
                  }}
                  ensureUniqueSorted={ensureUniqueSorted}
                  usageFn={countTypeUsage}
                  supportsColor
                />
              ),
            },
            {
              key: 'teams',
              label: 'Teams',
              children: (
                <DropdownManager
                  kind="teams"
                  values={dropdownData.teams}
                  onPatch={async (nextValues) => {
                    const payload = { ...dropdownData, teams: ensureUniqueSorted(nextValues) };
                    await axios.patch(APIURL + 'dropdowns', payload);
                    setDropdownData(payload);
                    message.success('Teams updated');
                  }}
                  ensureUniqueSorted={ensureUniqueSorted}
                  usageFn={countTeamUsage}
                />
              ),
            },
            {
              key: 'domains',
              label: 'Domains',
              children: (
                <DropdownManager
                  kind="domains"
                  values={dropdownData.domains}
                  onPatch={async (nextValues) => {
                    const payload = { ...dropdownData, domains: ensureUniqueSorted(nextValues) };
                    await axios.patch(APIURL + 'dropdowns', payload);
                    setDropdownData(payload);
                    message.success('Domains updated');
                  }}
                  ensureUniqueSorted={ensureUniqueSorted}
                  usageFn={countDomainUsage}
                />
              ),
            },
            {
              key: 'locations',
              label: 'Locations',
              children: (
                <DropdownManager
                  kind="locations"
                  values={dropdownData.locations}
                  onPatch={async (nextValues) => {
                    const payload = { ...dropdownData, locations: ensureUniqueSorted(nextValues) };
                    await axios.patch(APIURL + 'dropdowns', payload);
                    setDropdownData(payload);
                    message.success('Locations updated');
                  }}
                  ensureUniqueSorted={ensureUniqueSorted}
                  usageFn={countLocationUsage}
                />
              ),
            },
          ]}
        />
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
              setBulkCentralText('');
              setBulkCentralPreview([]);
              setBulkCentralErrors([]);
              setBulkCentralOpen(true);
            }}>
              Bulk Import
            </Button>
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

      <Drawer
        title="All Events"
        open={allEventsOpen}
        onClose={() => setAllEventsOpen(false)}
        width={800}
      >
        <Collapse defaultActiveKey={['user']} accordion={false} style={{ background: 'transparent' }}>
          <Collapse.Panel header={`User Events (${allEventsData.length})`} key="user">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Input.Search
                placeholder="Search by name / type / date"
                allowClear
                value={eventsSearch}
                onChange={(e) => setEventsSearch(e.target.value)}
              />
            </div>
            <List
              dataSource={allEventsData}
              pagination={{ pageSize: 10 }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <a
                      key="edit"
                      onClick={() => {
                        onUpdate(item);
                        setAllEventsOpen(false);
                      }}
                    >
                      Edit
                    </a>,
                    <a
                      key="delete"
                      onClick={() => {
                        onDelete(item);
                      }}
                    >
                      Delete
                    </a>,
                  ]}
                >
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color={typeColorMap[item.type] || 'default'}>{item.type}</Tag>
                    <strong>{nameById(item.user_id)}</strong>
                    <span>({dayjs(item.start).format('YYYY-MM-DD')} → {dayjs(item.end).format('YYYY-MM-DD')})</span>
                  </div>
                </List.Item>
              )}
            />
          </Collapse.Panel>
          <Collapse.Panel header={`Central Events (${centralEvents.length})`} key="central">
            <List
              pagination={{ pageSize: 10 }}
              dataSource={centralEvents}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color="geekblue">Central</Tag>
                    <strong>{item.name}</strong>
                    <span>({dayjs(item.start).format('YYYY-MM-DD')} → {dayjs(item.end).format('YYYY-MM-DD')})</span>
                  </div>
                </List.Item>
              )}
            />
          </Collapse.Panel>
          <Collapse.Panel header={`Holidays (${holidays.length})`} key="holidays">
            <List
              pagination={{ pageSize: 10 }}
              dataSource={holidays}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color={getRegionColor(item.region)}>{item.region}</Tag>
                    <strong>{item.name}</strong>
                    <span>({dayjs(item.start).format('YYYY-MM-DD')})</span>
                  </div>
                </List.Item>
              )}
            />
          </Collapse.Panel>
        </Collapse>
      </Drawer>

      <Modal
        width={820}
        title="Bulk Import Central Events"
        open={bulkCentralOpen}
        onCancel={() => setBulkCentralOpen(false)}
        okText="Import"
        onOk={async () => {
          if (!bulkCentralPreview.length) {
            message.warning('Import edilecek geçerli satır yok.');
            return;
          }
          try {
            for (const item of bulkCentralPreview) {
              await createCentral(item);
            }
            setCentralEvents(prev => [...prev, ...bulkCentralPreview].sort((a,b) => dayjs(a.start).diff(dayjs(b.start))));
            message.success(`${bulkCentralPreview.length} central event eklendi`);
            setBulkCentralOpen(false);
            setBulkCentralText('');
            setBulkCentralPreview([]);
            setBulkCentralErrors([]);
          } catch (e) {
            message.error('Import sırasında hata oluştu');
          }
        }}
      >
        <p style={{ marginBottom: 8 }}>
        Select the <b>Name | Start | End</b> columns in Excel and <b>Copy</b> them, then <b>Paste</b> below.
<br/>Date formats such as <code>YYYY-MM-DD</code>, <code>DD.MM.YYYY</code>, <code>MM/DD/YYYY</code>, etc. are accepted.
<br/>If the first row is a <i>header</i>, it will be skipped automatically.
        </p>
        <Input.TextArea
          rows={8}
          value={bulkCentralText}
          onChange={(e) => {
            const val = e.target.value;
            setBulkCentralText(val);
            const { preview, errors } = parseCentralPaste(val);
            const existKeys = new Set(centralEvents.map(c => `${c.name}__${c.start}__${c.end}`));
            const dedupPreview = preview.filter(p => !existKeys.has(`${p.name}__${p.start}__${p.end}`));
            setBulkCentralPreview(dedupPreview);
            setBulkCentralErrors(errors);
          }}
          placeholder={`Example with header (optional):
      Name\tStart\tEnd
      Release\t2025-08-07\t2025-08-07
      2025 - Q2 Planning\t16.08.2025\t21.08.2025`}
        />

        <Divider />

        <div style={{ display:'flex', gap:16 }}>
          <div style={{ flex:1 }}>
            <h4 style={{ marginBottom: 8 }}>Preview ({bulkCentralPreview.length})</h4>
            <List
              size="small"
              bordered
              dataSource={bulkCentralPreview}
              renderItem={(it) => (
                <List.Item>
                  <Space wrap>
                    <Tag color="geekblue">Central</Tag>
                    <strong>{it.name}</strong>
                    <span>({it.start} → {it.end})</span>
                  </Space>
                </List.Item>
              )}
              style={{ maxHeight: 240, overflow: 'auto' }}
            />
          </div>
          <div style={{ flex:1 }}>
            <h4 style={{ marginBottom: 8 }}>Errors ({bulkCentralErrors.length})</h4>
            <List
              size="small"
              bordered
              dataSource={bulkCentralErrors}
              renderItem={(er) => (
                <List.Item>
                  <Space>
                    <Tag color="red">Line {er.line}</Tag>
                    <span>{er.reason}</span>
                  </Space>
                </List.Item>
              )}
              style={{ maxHeight: 240, overflow: 'auto' }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        width={860}
        title="Bulk Import Events"
        open={bulkEventsOpen}
        onCancel={() => setBulkEventsOpen(false)}
        okText="Import"
        onOk={async () => {
          if (!bulkEventsPreview.length) {
            message.warning('There are no valid rows to import.');
            return;
          }
          try {
            // json-server has no batch: POST sequentially
            for (const ev of bulkEventsPreview) {
              // clean preview-only field
              const { __displayName, ...toSave } = ev;
              await createEvent(toSave);
            }
            // update client state
            setEvents(prev => {
              const merged = [...prev, ...bulkEventsPreview.map(({__displayName, ...r}) => r)];
              applyFilters(merged, filters);
              return merged;
            });
            message.success(`${bulkEventsPreview.length} event(s) imported`);
            setBulkEventsOpen(false);
            setBulkEventsText('');
            setBulkEventsPreview([]);
            setBulkEventsErrors([]);
          } catch (e) {
            message.error('Import failed');
          }
        }}
      >
        <p style={{ marginBottom: 8 }}>
          Select the <b>Name | Type | Start | End</b> columns in Excel, <b>Copy</b>, then <b>Paste</b> below.
          <br/>Accepted date formats: <code>YYYY-MM-DD</code>, <code>DD.MM.YYYY</code>, <code>MM/DD/YYYY</code>, etc.
          <br/>If the first row is a <i>header</i>, it is skipped automatically.
        </p>

        <Input.TextArea
          rows={8}
          value={bulkEventsText}
          onChange={(e) => {
            const val = e.target.value;
            setBulkEventsText(val);

            const { preview, errors } = parseEventsPaste(
              val,
              people,
              dropdownData?.types || []
            );

            // remove duplicates against existing events
            const existKeys = new Set(
              events.map(ev => `${ev.user_id}__${ev.type}__${ev.start}__${ev.end}`)
            );
            const dedupPreview = preview.filter(p => !existKeys.has(`${p.user_id}__${p.type}__${p.start}__${p.end}`));

            setBulkEventsPreview(dedupPreview);
            setBulkEventsErrors(errors);
          }}
          placeholder={`(Header optional)
      Name\tType\tStart\tEnd
      Jane Doe\tVacation\t2025-08-12\t2025-08-16
      John Smith\tSick Leave\t15.08.2025\t16.08.2025`}
        />

        <Divider />

        <div style={{ display:'flex', gap:16 }}>
          <div style={{ flex:1 }}>
            <h4 style={{ marginBottom: 8 }}>Preview ({bulkEventsPreview.length})</h4>
            <List
              size="small"
              bordered
              dataSource={bulkEventsPreview}
              style={{ maxHeight: 260, overflow: 'auto' }}
              renderItem={(it) => (
                <List.Item>
                  <Space wrap>
                    <Tag color={typeColorMap[it.type] || 'default'}>{it.type}</Tag>
                    <strong>{it.__displayName}</strong>
                    <span>({it.start} → {it.end})</span>
                  </Space>
                </List.Item>
              )}
            />
          </div>
          <div style={{ flex:1 }}>
            <h4 style={{ marginBottom: 8 }}>Errors ({bulkEventsErrors.length})</h4>
            <List
              size="small"
              bordered
              dataSource={bulkEventsErrors}
              style={{ maxHeight: 260, overflow: 'auto' }}
              renderItem={(er) => (
                <List.Item>
                  <Space>
                    <Tag color="red">Line {er.line}</Tag>
                    <span>{er.reason}</span>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;

const DropdownManager = ({
  kind,                   
  values = [],
  colorMap = {},
  usageFn = () => 0,
  onPatch,               
  supportsColor = false,
  ensureUniqueSorted
}) => {
  const [list, setList] = useState(values);
  const [colors, setColors] = useState(colorMap);
  const [adding, setAdding] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  useEffect(() => { setList(values); }, [values]);
  useEffect(() => { setColors(colorMap); }, [colorMap]);

  const saveAll = async () => {
    const cleaned = ensureUniqueSorted(list.map(v => v.trim()).filter(Boolean));
    let nextColors = colors;
    if (supportsColor) {
      nextColors = Object.fromEntries(
        Object.entries(colors).filter(([k]) => cleaned.includes(k))
      );
    }
    await onPatch(cleaned, nextColors);
  };

  const addOne = async () => {
    const v = adding.trim();
    if (!v) return;
    if (list.includes(v)) {
      message.warning('Already exists');
      return;
    }
    const next = ensureUniqueSorted([...list, v]);
    setList(next);
    setAdding('');
    await onPatch(next, colors);
  };

  const removeOne = async (v) => {
    const inUse = usageFn(v) > 0;
    if (inUse) {
      Modal.confirm({
        title: 'Value in use',
        content: `“${v}” is referenced. Are you sure you want to remove it?`,
        okType: 'danger',
        onOk: async () => {
          const next = list.filter(x => x !== v);
          const nextColors = supportsColor ? Object.fromEntries(Object.entries(colors).filter(([k]) => k !== v)) : colors;
          setList(next);
          setColors(nextColors);
          await onPatch(next, nextColors);
        }
      });
      return;
    }
    const next = list.filter(x => x !== v);
    const nextColors = supportsColor ? Object.fromEntries(Object.entries(colors).filter(([k]) => k !== v)) : colors;
    setList(next);
    setColors(nextColors);
    await onPatch(next, nextColors);
  };

  const startEdit = (v) => {
    setEditingKey(v);
    setEditingValue(v);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  const saveEdit = async (oldVal) => {
    const newVal = editingValue.trim();
    if (!newVal) {
      message.warning('Value cannot be empty');
      return;
    }
    if (newVal !== oldVal && list.includes(newVal)) {
      message.warning('Value already exists');
      return;
    }
    const next = list.map(x => (x === oldVal ? newVal : x));
    let nextColors = colors;
    if (supportsColor && colors[oldVal]) {
      nextColors = { ...colors };
      nextColors[newVal] = nextColors[oldVal];
      delete nextColors[oldVal];
    }
    setList(next);
    setColors(nextColors);
    setEditingKey(null);
    setEditingValue('');
    await onPatch(next, nextColors);
  };

  const setColor = async (v, color) => {
    if (!supportsColor) return;
    const nextColors = { ...colors, [v]: color };
    setColors(nextColors);
    await onPatch(list, nextColors);
  };

  const doBulkAdd = async () => {
    const incoming = bulkText
      .split(/\r?\n/)
      .map(v => v.trim())
      .filter(Boolean);
    const next = ensureUniqueSorted([...list, ...incoming]);
    setList(next);
    setBulkOpen(false);
    setBulkText('');
    await onPatch(next, colors);
  };

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <Input
          placeholder={`Add new ${kind.slice(0, -1)}`}
          value={adding}
          onChange={e => setAdding(e.target.value)}
          onPressEnter={addOne}
          style={{ width: 300 }}
        />
        <Button icon={<PlusOutlined />} type="primary" onClick={addOne}>Add</Button>
        <Button icon={<InboxOutlined />} onClick={() => setBulkOpen(true)}>Bulk Add</Button>
        <div style={{ marginLeft: 'auto' }}>
          <Button onClick={saveAll}>Save All</Button>
        </div>
      </div>

      <List
        dataSource={list}
        bordered
        renderItem={(v) => {
          const usage = usageFn(v);
          const isEditing = editingKey === v;
          return (
            <List.Item
              actions={[
                isEditing ? (
                  <>
                    <a onClick={() => saveEdit(v)} key="save" style={{ marginRight: 4}}><SaveOutlined /> Save</a>
                    <a onClick={cancelEdit} key="cancel"><CloseOutlined /> Cancel</a>
                  </>
                ) : (
                  <a onClick={() => startEdit(v)} key="edit"><EditOutlined /> Edit</a>
                ),
                <a onClick={() => removeOne(v)} key="delete" style={{ color: 'red' }}>
                  <DeleteOutlined /> Delete{usage ? ` (${usage})` : ''}
                </a>,
              ]}
            >
              <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', width:'100%' }}>
                {isEditing ? (
                  <Input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onPressEnter={() => saveEdit(v)}
                    style={{ maxWidth: 360 }}
                  />
                ) : (
                  <strong>{v}</strong>
                )}

                <span style={{ opacity: .7 }}>Used: {usage}</span>

                {supportsColor && !isEditing && (
                  <>
                    <span style={{ opacity: .7 }}>Color:</span>
                    <Input
                      type="color"
                      value={colors[v] || '#1677ff'}
                      onChange={(e) => setColor(v, e.target.value)}
                      style={{ width: 48, padding: 2 }}
                    />
                  </>
                )}
              </div>
            </List.Item>
          );
        }}
      />

      <Modal
        title="Bulk Add"
        open={bulkOpen}
        onCancel={() => setBulkOpen(false)}
        onOk={doBulkAdd}
        okText="Add"
      >
        <p>Paste one value per line:</p>
        <Input.TextArea
          rows={6}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Example:
Vacation
Sick Leave
Training"
        />
      </Modal>
    </div>
  );
};
