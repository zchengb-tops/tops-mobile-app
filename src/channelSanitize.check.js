const SUPPORTED = new Set([
  'sina', 'zhihu', 'sspai', 'xiaoyuzhou', 'stock',
  'doubanMovie', 'bilibili', 'nnGroup', 'tiobe', 'history', 'arena',
]);

const getChannelComponent = (channel) =>
  SUPPORTED.has(channel?.channelCode || channel?.id) ? {} : undefined;

const isAppSupportedChannel = (channel) =>
  Boolean(channel?.isRss) || Boolean(getChannelComponent(channel));

const sanitizeChannelsForApp = (channelList = []) =>
  channelList.map((channel) =>
    isAppSupportedChannel(channel) ? channel : {...channel, enable: false}
  );

const resolveIcon = (channel) => {
  if (typeof channel.renderIcon === 'function') return 'component-icon';
  if (channel.iconUrl) return 'remote-icon';
  return 'placeholder';
};

const arenaFromProdSync = {
  id: 13,
  channelCode: 'arena',
  tabTitle: 'Arena',
  iconUrl: null,
  isRss: false,
  enable: true,
};

const unknownChannel = {
  id: 99,
  channelCode: 'futureThing',
  isRss: false,
  enable: true,
};

const sanitizedArena = sanitizeChannelsForApp([arenaFromProdSync]);
console.assert(sanitizedArena[0].enable === true, 'arena stays enabled once mapped');
const sanitizedUnknown = sanitizeChannelsForApp([unknownChannel]);
console.assert(sanitizedUnknown[0].enable === false, 'unknown channel disabled');
console.assert(resolveIcon({...sanitizedArena[0], renderIcon: undefined}) === 'placeholder', 'missing icon must not call renderIcon');
console.assert(resolveIcon({renderIcon: () => null}) === 'component-icon', 'mapped icon still works');
console.assert(resolveIcon({iconUrl: 'https://x/a.svg'}) === 'remote-icon', 'remote icon fallback works');
console.assert(isAppSupportedChannel({isRss: true, enable: true}) === true, 'rss stays supported');
console.log('channel-sanitize-check ok');
