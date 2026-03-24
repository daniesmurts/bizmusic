// Обработка сообщения SKIP_WAITING от клиента
// для активации нового воркера по запросу пользователя
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
