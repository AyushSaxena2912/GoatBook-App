let listeners = [];

export const onSubscriptionExpired = (callback) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

export const triggerSubscriptionExpired = (payload) => {
  listeners.forEach(cb => cb(payload));
};
