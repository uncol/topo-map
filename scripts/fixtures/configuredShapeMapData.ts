export const glyphSegmentMapData = {
  id: '694f2320f73e86f3d01e51c2',
  type: 'segment',
  max_links: 1000,
  grid_size: 25,
  normalize_position: true,
  object_status_refresh_interval: 60,
  background_image: null,
  background_opacity: null,
  name: 'ALL',
  width: 156.25,
  height: 123.75,
  caps: [],
  nodes: [
    {
      role: 'segment',
      address: '1.1.1.1',
      type: 'managedobject',
      id: '1',
      x: 56.25,
      y: 23.75,
      node_id: 1,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'SAE',
      glyph: 61996,
      cls: 'gf-1x',
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '192.168.133.13',
      type: 'managedobject',
      id: '2',
      x: 156.25,
      y: 123.75,
      node_id: 2,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'chr-1',
      glyph: 61996,
      cls: 'gf-1x',
      shape_overlay: [],
      ports: [
        {
          id: 1,
          ports: ['ether1']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '192.168.133.14',
      type: 'managedobject',
      id: '3',
      x: 156.25,
      y: 23.75,
      node_id: 3,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'chr-2',
      glyph: 61996,
      cls: 'gf-1x',
      shape_overlay: [
        {
          code: 58024,
          position: 'NE',
          form: 'c'
        }
      ],
      ports: [
        {
          id: 0,
          ports: ['ether2']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    }
  ],
  links: [
    {
      connector: 'normal',
      id: '69676d2cfa1bc463f16465e2',
      type: 'link',
      method: 'lldp',
      ports: [0, 1],
      in_bw: 10000000000,
      out_bw: 10000000000,
      bw: 10000000000
    }
  ]
};

export const configuredShapeMapData = {
  id: '6972456b3819bc893f2ab6c5',
  type: 'configured',
  max_links: 1000,
  grid_size: 25,
  normalize_position: false,
  object_status_refresh_interval: 60,
  background_image: '69740ce78ce3e3bca22290ae',
  background_opacity: 30,
  name: 'configured',
  width: 3200,
  height: 1800,
  caps: [],
  nodes: [
    {
      type: 'objectgroup',
      id: '6973ffeb8ce3e3bca2229017',
      x: 1300,
      y: 100,
      node_id: '6973ffeb8ce3e3bca2229017',
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Атмосфера+ZIAX',
      shape: 'Cisco/router',
      shape_width: 47.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: {
        resource_group: '6973ffeb8ce3e3bca2229017'
      }
    },
    {
      type: 'objectgroup',
      id: '69723f3e3819bc893f2ab6ab',
      x: 1600,
      y: 1025,
      node_id: '69723f3e3819bc893f2ab6ab',
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Видеоаналитика',
      shape: 'Cisco/router',
      shape_width: 47.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: {
        resource_group: '69723f3e3819bc893f2ab6ab'
      }
    },
    {
      type: 'objectgroup',
      id: '69723f163819bc893f2ab6a1',
      x: 1050,
      y: 100,
      node_id: '69723f163819bc893f2ab6a1',
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Корпоративная связь',
      shape: 'Cisco/router',
      shape_width: 47.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: {
        resource_group: '69723f163819bc893f2ab6a1'
      }
    },
    {
      type: 'objectgroup',
      id: '6973fff38ce3e3bca222901a',
      x: 1525,
      y: 100,
      node_id: '6973fff38ce3e3bca222901a',
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'СИЗАР-База знаний',
      shape: 'Cisco/router',
      shape_width: 47.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: {
        resource_group: '6973fff38ce3e3bca222901a'
      }
    },
    {
      type: 'objectgroup',
      id: '69723f5c3819bc893f2ab6b4',
      x: 1000,
      y: 1025,
      node_id: '69723f5c3819bc893f2ab6b4',
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Свободно-конфигурируемая зона',
      shape: 'Cisco/router',
      shape_width: 47.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: {
        resource_group: '69723f5c3819bc893f2ab6b4'
      }
    },
    {
      type: 'objectgroup',
      id: '69723f483819bc893f2ab6ae',
      x: 2150,
      y: 1025,
      node_id: '69723f483819bc893f2ab6ae',
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Сети передачи данных и мониторинг',
      shape: 'Cisco/router',
      shape_width: 47.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: {
        resource_group: '69723f483819bc893f2ab6ae'
      }
    },
    {
      type: 'objectgroup',
      id: '69723f363819bc893f2ab6a8',
      x: 2900,
      y: 75,
      node_id: '69723f363819bc893f2ab6a8',
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Ситуационный центр',
      shape: 'Cisco/router',
      shape_width: 47.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: {
        resource_group: '69723f363819bc893f2ab6a8'
      }
    },
    {
      type: 'objectgroup',
      id: '69723f2d3819bc893f2ab6a5',
      x: 1950,
      y: 100,
      node_id: '69723f2d3819bc893f2ab6a5',
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Технологическая связь',
      shape: 'Cisco/router',
      shape_width: 47.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: {
        resource_group: '69723f2d3819bc893f2ab6a5'
      }
    },
    {
      type: 'objectgroup',
      id: '69723f523819bc893f2ab6b1',
      x: 2500,
      y: 1025,
      node_id: '69723f523819bc893f2ab6b1',
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Энербас+Ревизор',
      shape: 'Cisco/router',
      shape_width: 47.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: {
        resource_group: '69723f523819bc893f2ab6b1'
      }
    },
    {
      role: 'segment',
      address: '10.100.16.162',
      type: 'managedobject',
      id: '31',
      x: 2025,
      y: 900,
      node_id: 31,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'СОВА Моноблок',
      shape: 'Cisco/workstation',
      shape_width: 46.25,
      shape_height: 37.5,
      shape_overlay: [],
      ports: [
        {
          id: 59,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.19',
      type: 'managedobject',
      id: '25',
      x: 2700,
      y: 200,
      node_id: 25,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-16@10018',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 51,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.3',
      type: 'managedobject',
      id: '5',
      x: 950,
      y: 350,
      node_id: 5,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-25@10002',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 7,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: null,
      type: 'managedobject',
      id: '17',
      x: 2555.9749979999997,
      y: 275.5,
      node_id: 17,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Рупор громкоговорителя настенный',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.105',
      type: 'managedobject',
      id: '16',
      x: 2325,
      y: 25,
      node_id: 16,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'УПГ-78#3',
      shape: 'Cisco/phone',
      shape_width: 40,
      shape_height: 30,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.17',
      type: 'managedobject',
      id: '13',
      x: 1650,
      y: 400,
      node_id: 13,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'РТУ Дилинговый пульт@10016',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 19,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.102',
      type: 'managedobject',
      id: '14',
      x: 2050,
      y: 250,
      node_id: 14,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'УПГ-78#1',
      shape: 'Cisco/phone',
      shape_width: 40,
      shape_height: 30,
      shape_overlay: [],
      ports: [
        {
          id: 21,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.220',
      type: 'managedobject',
      id: '39',
      x: 1800,
      y: 800,
      node_id: 39,
      metrics_label: '',
      metrics_template: '',
      level: 100,
      name: 'СОВА IDS3730-48P-6X',
      shape: 'Cisco/workgroup_switch',
      shape_width: 62.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [
        { id: 0, ports: ['gigabitethernet0/33'] },
        { id: 2, ports: ['gigabitethernet0/19'] },
        { id: 4, ports: ['gigabitethernet0/23'] },
        { id: 6, ports: ['gigabitethernet0/27'] },
        { id: 10, ports: ['gigabitethernet0/21'] },
        { id: 12, ports: ['gigabitethernet0/13'] },
        { id: 16, ports: ['gigabitethernet0/31'] },
        { id: 18, ports: ['gigabitethernet0/22'] },
        { id: 20, ports: ['gigabitethernet0/20'] },
        { id: 23, ports: ['gigabitethernet0/30'] },
        { id: 39, ports: ['gigabitethernet0/8'] },
        { id: 46, ports: ['gigabitethernet0/28'] },
        { id: 48, ports: ['gigabitethernet0/4'] },
        { id: 50, ports: ['gigabitethernet0/10'] },
        { id: 61, ports: ['gigabitethernet0/45'] },
        { id: 64, ports: ['gigabitethernet0/35'] },
        { id: 66, ports: ['gigabitethernet0/29'] },
        { id: 68, ports: ['gigabitethernet0/11'] },
        { id: 70, ports: ['gigabitethernet0/26'] },
        { id: 72, ports: ['gigabitethernet0/12'] }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.8',
      type: 'managedobject',
      id: '35',
      x: 875,
      y: 325,
      node_id: 35,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-13@10007',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 65,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: null,
      type: 'managedobject',
      id: '38',
      x: 1800,
      y: 950,
      node_id: 38,
      metrics_label: '',
      metrics_template: '',
      level: 100,
      name: 'СОВА NSS4330-32TXP-2',
      shape: 'Cisco/workgroup_switch',
      shape_width: 62.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.226',
      type: 'managedobject',
      id: '27',
      x: 1400,
      y: 875,
      node_id: 27,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Vizorlabs Ноутбук',
      shape: 'Cisco/workstation',
      shape_width: 46.25,
      shape_height: 37.5,
      shape_overlay: [],
      ports: [
        {
          id: 55,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.5',
      type: 'managedobject',
      id: '7',
      x: 900,
      y: 100,
      node_id: 7,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-13@10004',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.11',
      type: 'managedobject',
      id: '3',
      x: 1025,
      y: 225,
      node_id: 3,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-25@10010',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 3,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.100',
      type: 'managedobject',
      id: '48',
      x: 1775,
      y: 225,
      node_id: 48,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'LCE',
      shape: 'Flaticon/hub',
      shape_width: 32,
      shape_height: 32,
      shape_overlay: [],
      ports: [
        {
          id: 35,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.12',
      type: 'managedobject',
      id: '6',
      x: 1225,
      y: 225,
      node_id: 6,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-16@10011',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 9,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.103',
      type: 'managedobject',
      id: '18',
      x: 2150,
      y: 250,
      node_id: 18,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'УПГ-07',
      shape: 'Cisco/phone',
      shape_width: 40,
      shape_height: 30,
      shape_overlay: [],
      ports: [
        {
          id: 29,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.225',
      type: 'managedobject',
      id: '26',
      x: 1525,
      y: 900,
      node_id: 26,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Vizorlabs Моноблок',
      shape: 'Cisco/workstation',
      shape_width: 46.25,
      shape_height: 37.5,
      shape_overlay: [],
      ports: [
        {
          id: 53,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.221',
      type: 'managedobject',
      id: '32',
      x: 1800,
      y: 875,
      node_id: 32,
      metrics_label: '',
      metrics_template: '',
      level: 100,
      name: 'СОВА NSS4330-32TXP-1',
      shape: 'Cisco/workgroup_switch',
      shape_width: 62.5,
      shape_height: 32.5,
      shape_overlay: [],
      ports: [
        { id: 8, ports: ['gigabitethernet0/4'] },
        { id: 14, ports: ['gigabitethernet0/6'] },
        { id: 36, ports: ['gigabitethernet0/14'] },
        { id: 52, ports: ['gigabitethernet0/23'] },
        { id: 54, ports: ['gigabitethernet0/13'] },
        { id: 56, ports: ['gigabitethernet0/9'] },
        { id: 58, ports: ['gigabitethernet0/7'] },
        { id: 60, ports: ['gigabitethernet0/24'] },
        { id: 62, ports: ['gigabitethernet0/3'] }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.4',
      type: 'managedobject',
      id: '8',
      x: 950,
      y: 200,
      node_id: 8,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-22@10003',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 11,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.10',
      type: 'managedobject',
      id: '42',
      x: 1650,
      y: 250,
      node_id: 42,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-25@10009',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 69,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.14',
      type: 'managedobject',
      id: '43',
      x: 900,
      y: 50,
      node_id: 43,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-13@10013',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.9',
      type: 'managedobject',
      id: '36',
      x: 875,
      y: 175,
      node_id: 36,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-13@10008',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 67,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.115',
      type: 'managedobject',
      id: '19',
      x: 2275,
      y: 250,
      node_id: 19,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Техносвязь Пульт СОДС@10021',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 37,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.104',
      type: 'managedobject',
      id: '15',
      x: 2325,
      y: 75,
      node_id: 15,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'УПГ-78#2',
      shape: 'Cisco/phone',
      shape_width: 40,
      shape_height: 30,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.16',
      type: 'managedobject',
      id: '12',
      x: 900,
      y: 425,
      node_id: 12,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'РТУ Пульт СОДС@10015',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 17,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.13',
      type: 'managedobject',
      id: '4',
      x: 950,
      y: 300,
      node_id: 4,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-27@10012',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 5,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.15',
      type: 'managedobject',
      id: '41',
      x: 1650,
      y: 300,
      node_id: 41,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-27@10014',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 71,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.130',
      type: 'managedobject',
      id: '21',
      x: 2900,
      y: 250,
      node_id: 21,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'САЦ Моноблок 2',
      shape: 'Cisco/workstation',
      shape_width: 46.25,
      shape_height: 37.5,
      shape_overlay: [],
      ports: [
        {
          id: 47,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.99',
      type: 'managedobject',
      id: '47',
      x: 1775,
      y: 325,
      node_id: 47,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'LDE 2',
      shape: 'Flaticon/hub',
      shape_width: 32,
      shape_height: 32,
      shape_overlay: [],
      ports: [
        {
          id: 25,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.131',
      type: 'managedobject',
      id: '22',
      x: 2900,
      y: 325,
      node_id: 22,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'САЦ Моноблок 3',
      shape: 'Cisco/workstation',
      shape_width: 46.25,
      shape_height: 37.5,
      shape_overlay: [],
      ports: [
        {
          id: 43,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.132',
      type: 'managedobject',
      id: '23',
      x: 2900,
      y: 400,
      node_id: 23,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'САЦ Моноблок 4',
      shape: 'Cisco/workstation',
      shape_width: 46.25,
      shape_height: 37.5,
      shape_overlay: [],
      ports: [
        {
          id: 45,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.227',
      type: 'managedobject',
      id: '28',
      x: 1475,
      y: 950,
      node_id: 28,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Vizorlabs Камера Dahua',
      shape: 'Flaticon/web-camera',
      shape_width: 32,
      shape_height: 32,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.21',
      type: 'managedobject',
      id: '10',
      x: 1300,
      y: 225,
      node_id: 10,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Атмосфера Моноблок',
      shape: 'Cisco/workstation',
      shape_width: 46.25,
      shape_height: 37.5,
      shape_overlay: [],
      ports: [
        {
          id: 15,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.2',
      type: 'managedobject',
      id: '2',
      x: 875,
      y: 250,
      node_id: 2,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-27@10001',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 1,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.161',
      type: 'managedobject',
      id: '33',
      x: 2375,
      y: 900,
      node_id: 33,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Энербас Моноблок 1',
      shape: 'Cisco/workstation',
      shape_width: 46.25,
      shape_height: 37.5,
      shape_overlay: [],
      ports: [
        {
          id: 63,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.101',
      type: 'managedobject',
      id: '44',
      x: 1975,
      y: 250,
      node_id: 44,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'УПГ-12E-BM',
      shape: 'Cisco/phone',
      shape_width: 40,
      shape_height: 30,
      shape_overlay: [],
      ports: [
        {
          id: 31,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.20',
      type: 'managedobject',
      id: '9',
      x: 1100,
      y: 225,
      node_id: 9,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'РТУ моноблок 1',
      shape: 'Cisco/workstation',
      shape_width: 46.25,
      shape_height: 37.5,
      shape_overlay: [],
      ports: [
        {
          id: 13,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.18',
      type: 'managedobject',
      id: '24',
      x: 2625,
      y: 200,
      node_id: 24,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-25@10017',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 49,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.98',
      type: 'managedobject',
      id: '46',
      x: 1775,
      y: 375,
      node_id: 46,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'LDE 1',
      shape: 'Flaticon/hub',
      shape_width: 32,
      shape_height: 32,
      shape_overlay: [],
      ports: [
        {
          id: 27,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.228',
      type: 'managedobject',
      id: '29',
      x: 1675,
      y: 925,
      node_id: 29,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Vizorlabs гобопроектор',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.6',
      type: 'managedobject',
      id: '40',
      x: 1650,
      y: 350,
      node_id: 40,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-27@10005',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 73,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.7',
      type: 'managedobject',
      id: '37',
      x: 900,
      y: 0,
      node_id: 37,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Т-25@10006',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.229',
      type: 'managedobject',
      id: '30',
      x: 1325,
      y: 900,
      node_id: 30,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'Vizorlabs громкоговоритель',
      shape: 'Cisco/ip_phone',
      shape_width: 54.025002,
      shape_height: 29.5,
      shape_overlay: [],
      ports: [
        {
          id: 57,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.22',
      type: 'managedobject',
      id: '11',
      x: 1525,
      y: 225,
      node_id: 11,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'СИЗАР Моноблок',
      shape: 'Cisco/workstation',
      shape_width: 46.25,
      shape_height: 37.5,
      shape_overlay: [],
      ports: [],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.110',
      type: 'managedobject',
      id: '45',
      x: 1775,
      y: 275,
      node_id: 45,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'LBC-8',
      shape: 'Flaticon/hub',
      shape_width: 32,
      shape_height: 32,
      shape_overlay: [],
      ports: [
        {
          id: 33,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      role: 'segment',
      address: '10.100.16.129',
      type: 'managedobject',
      id: '20',
      x: 2900,
      y: 175,
      node_id: 20,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name: 'САЦ Моноблок 1',
      shape: 'Cisco/workstation',
      shape_width: 46.25,
      shape_height: 37.5,
      shape_overlay: [],
      ports: [
        {
          id: 41,
          ports: ['port0']
        }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      type: 'cloud',
      id: '697ba229d58805e96c998be6',
      x: 1850,
      y: 375,
      node_id: null,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name:
        '(СОВА IDS3730-48P-6X: gigabitethernet0/30, LDE 2: port0, LDE 1: port0, УПГ-07: port0, УПГ-12E-BM: port0, LBC-8: port0, LCE: port0)',
      shape: 'Cisco/cloud',
      shape_width: 102.74,
      shape_height: 59.05,
      shape_overlay: [],
      ports: [
        { id: 22, ports: ['cloud'] },
        { id: 24, ports: ['cloud'] },
        { id: 26, ports: ['cloud'] },
        { id: 28, ports: ['cloud'] },
        { id: 30, ports: ['cloud'] },
        { id: 32, ports: ['cloud'] },
        { id: 34, ports: ['cloud'] }
      ],
      caps: [],
      object_filter: null,
      external: false
    },
    {
      type: 'cloud',
      id: '697bae5bd58805e96c998c0b',
      x: 2500,
      y: 550,
      node_id: null,
      metrics_label: '',
      metrics_template: '',
      level: 25,
      name:
        '(СОВА IDS3730-48P-6X: gigabitethernet0/8, САЦ Моноблок 1: port0, САЦ Моноблок 3: port0, САЦ Моноблок 4: port0)',
      shape: 'Cisco/cloud',
      shape_width: 102.74,
      shape_height: 59.05,
      shape_overlay: [],
      ports: [
        { id: 38, ports: ['cloud'] },
        { id: 40, ports: ['cloud'] },
        { id: 42, ports: ['cloud'] },
        { id: 44, ports: ['cloud'] }
      ],
      caps: [],
      object_filter: null,
      external: false
    }
  ],
  links: [
    { connector: 'normal', id: '697baec7d58805e96c998c11', type: 'link', method: 'xmac', ports: [58, 59], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '6979f8fdf2119e8e0900a61d', type: 'link', method: 'xmac', ports: [50, 51], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '6979da8586f4fce918901796', type: 'link', method: 'xmac', ports: [6, 7], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '6979ffd9d58805e96c998849', type: 'link', method: 'xmac', ports: [18, 19], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '69793cfc8bd5ac6651e251c5', type: 'link', method: 'xmac', ports: [20, 21], in_bw: 100000000, out_bw: 100000000, bw: 100000000 },
    { connector: 'normal', id: '69791a5545b9868b4f2a9550', type: 'link', method: 'xmac', ports: [0, 1], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '69791a5545b9868b4f2a9551', type: 'link', method: 'xmac', ports: [2, 3], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697918e345b9868b4f2a94f2', type: 'link', method: 'xmac', ports: [4, 5], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697918e345b9868b4f2a94ef', type: 'link', method: 'xmac', ports: [10, 11], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '6979eaedf2119e8e0900a5f5', type: 'link', method: 'xmac', ports: [12, 13], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '6979ffd9d58805e96c99884a', type: 'link', method: 'xmac', ports: [16, 17], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697ba229d58805e96c998be6-22-23', type: 'link', method: 'xmac', ports: [22, 23], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697bae5bd58805e96c998c0b-38-39', type: 'link', method: 'xmac', ports: [38, 39], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697bae5bd58805e96c998c0c', type: 'link', method: 'xmac', ports: [46, 47], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '6979ca3986f4fce918901755', type: 'link', method: 'xmac', ports: [48, 49], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '69791d2d3e491851cf4d9569', type: 'link', method: 'lldp', ports: [60, 61], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '6979da8586f4fce918901794', type: 'link', method: 'xmac', ports: [64, 65], in_bw: 100000000, out_bw: 100000000, bw: 100000000 },
    { connector: 'normal', id: '69791a5545b9868b4f2a954e', type: 'link', method: 'xmac', ports: [66, 67], in_bw: 100000000, out_bw: 100000000, bw: 100000000 },
    { connector: 'normal', id: '697918e345b9868b4f2a94f1', type: 'link', method: 'xmac', ports: [68, 69], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697918e345b9868b4f2a94f3', type: 'link', method: 'xmac', ports: [70, 71], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '6979da8586f4fce918901795', type: 'link', method: 'xmac', ports: [72, 73], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697baec7d58805e96c998c10', type: 'link', method: 'xmac', ports: [54, 55], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697ba229d58805e96c998be6-34-35', type: 'link', method: 'xmac', ports: [34, 35], in_bw: 0, out_bw: 0, bw: 0 },
    { connector: 'normal', id: '6979dae986f4fce918901799', type: 'link', method: 'xmac', ports: [8, 9], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697ba229d58805e96c998be6-28-29', type: 'link', method: 'xmac', ports: [28, 29], in_bw: 0, out_bw: 0, bw: 0 },
    { connector: 'normal', id: '697c76e1d58805e96c998df2', type: 'link', method: 'xmac', ports: [52, 53], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '6979eb51f2119e8e0900a5f8', type: 'link', method: 'xmac', ports: [14, 15], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697baf24d58805e96c998c14', type: 'link', method: 'xmac', ports: [36, 37], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697c9cf8d58805e96c998e53', type: 'link', method: 'xmac', ports: [56, 57], in_bw: 100000000, out_bw: 100000000, bw: 100000000 },
    { connector: 'normal', id: '6979eb51f2119e8e0900a5f9', type: 'link', method: 'xmac', ports: [62, 63], in_bw: 1000000000, out_bw: 1000000000, bw: 1000000000 },
    { connector: 'normal', id: '697ba229d58805e96c998be6-24-25', type: 'link', method: 'xmac', ports: [24, 25], in_bw: 0, out_bw: 0, bw: 0 },
    { connector: 'normal', id: '697bae5bd58805e96c998c0b-42-43', type: 'link', method: 'xmac', ports: [42, 43], in_bw: 0, out_bw: 0, bw: 0 },
    { connector: 'normal', id: '697bae5bd58805e96c998c0b-44-45', type: 'link', method: 'xmac', ports: [44, 45], in_bw: 0, out_bw: 0, bw: 0 },
    { connector: 'normal', id: '697ba229d58805e96c998be6-30-31', type: 'link', method: 'xmac', ports: [30, 31], in_bw: 0, out_bw: 0, bw: 0 },
    { connector: 'normal', id: '697ba229d58805e96c998be6-26-27', type: 'link', method: 'xmac', ports: [26, 27], in_bw: 0, out_bw: 0, bw: 0 },
    { connector: 'normal', id: '697ba229d58805e96c998be6-32-33', type: 'link', method: 'xmac', ports: [32, 33], in_bw: 0, out_bw: 0, bw: 0 },
    { connector: 'normal', id: '697bae5bd58805e96c998c0b-40-41', type: 'link', method: 'xmac', ports: [40, 41], in_bw: 0, out_bw: 0, bw: 0 }
  ]
};
