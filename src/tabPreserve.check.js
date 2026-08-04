const resolveTabIndex = (nextChannelList, previousChannelList, currentTabIndex) => {
  const nextEnabled = nextChannelList.filter((channel) => channel.enable);
  if (!nextEnabled.length) {
    return 0;
  }
  const previousEnabled = previousChannelList.filter((channel) => channel.enable);
  const currentChannel = previousEnabled[currentTabIndex];
  if (!currentChannel) {
    return Math.min(currentTabIndex, nextEnabled.length - 1);
  }
  const matchedIndex = nextEnabled.findIndex((channel) => channel.id === currentChannel.id);
  return matchedIndex >= 0 ? matchedIndex : 0;
};

const previous = [
  {id: 1, enable: true},
  {id: 2, enable: true},
  {id: 13, enable: true},
];
const nextSame = [
  {id: 1, enable: true},
  {id: 2, enable: true},
  {id: 13, enable: true},
];
const nextReordered = [
  {id: 13, enable: true},
  {id: 1, enable: true},
  {id: 2, enable: true},
];
const nextWithoutCurrent = [
  {id: 1, enable: true},
  {id: 2, enable: true},
];

console.assert(resolveTabIndex(nextSame, previous, 2) === 2, 'keep arena tab');
console.assert(resolveTabIndex(nextReordered, previous, 2) === 0, 'follow channel id after reorder');
console.assert(resolveTabIndex(nextWithoutCurrent, previous, 2) === 0, 'fallback when channel removed');
console.assert(resolveTabIndex(nextSame, previous, 0) === 0, 'keep first tab');
console.log('tab-preserve-check ok');
