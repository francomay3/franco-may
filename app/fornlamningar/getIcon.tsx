import {
  Icon123,
  IconHome,
  IconFlame,
  IconHammer,
  IconBuilding,
  IconMapPin,
  IconShip,
  IconBone,
  IconMountain,
  IconWindmill,
  IconCaravan,
  IconFlag,
  IconCross,
  IconTree,
  IconMountainOff,
  IconGrave,
  IconCar,
  IconGraph,
  IconHorse,
  IconAnchor,
  IconCircle,
  IconPray,
  IconGeometry,
  IconHaze,
  IconBuildingFactory,
  IconBan,
  IconPick,
  IconRoad,
  IconDroplet,
  IconTractor,
} from '@tabler/icons-react';
import { Fornlamning } from './dbSchema';

const iconMap = {
  'Settlement site': IconHome,
  'Hearth / fire pit': IconFlame,
  'Bloomery remains': IconHammer,
  'Apartment settlement remains': IconBuilding,
  'Other settlement remains': IconMapPin,
  'Flat-ground grave': IconGrave,
  'Shipwreck / boat remains': IconShip,
  'Stone setting': IconBone,
  'Fire-cracked stone mound': IconMountain,
  Mill: IconWindmill,
  'Rock carving / petroglyph': IconCaravan,
  'Boundary marker': IconFlag,
  'Burial mound': IconCross,
  'Charcoal production site': IconTree,
  'Clearing cairn': IconMountainOff,
  'Single burial site': IconGrave,
  Cairn: IconCar,
  'Pitfall trap': IconGraph,
  'Hut foundation': IconHorse,
  'Boat landing site': IconAnchor,
  'Stone circle / stone row': IconCircle,
  'Stone-marked grave': IconCross,
  'Offering cairn': IconPray,
  Cemetery: IconGeometry,
  'Stone labyrinth': IconHaze,
  'Remains resembling ancient monument': IconBuildingFactory,
  'House foundation, historical period': IconBuildingFactory,
  'Signal beacon': IconBan,
  Quarry: IconPick,
  'Formation resembling ancient monument': IconBuildingFactory,
  'Historic carving': IconCaravan,
  'Stone chamber grave': IconCross,
  'Road marker': IconRoad,
  'Grave field / burial ground': IconGrave,
  'Sacred spring / traditional well': IconDroplet,
  'Small industry area': IconTractor,
};

const getIcon = (siteClass: Fornlamning['class'], selected: boolean) => {
  const defaultIcon = Icon123;
  const Icon = iconMap[siteClass as keyof typeof iconMap] || defaultIcon;
  const color = selected ? 'grape' : 'blue';
  return (
    <Icon
      size={24}
      stroke={1}
      color={`var(--mantine-color-${color}-1)`}
      fill={`var(--mantine-color-${color}-8)`}
    />
  );
};

export default getIcon;
