const fs = require('node:fs');
const crypto = require('node:crypto');

class MessageStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.messages = [];
    this.load();
  }

  load() {
    try { this.messages = JSON.parse(fs.readFileSync(this.filePath, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') console.error('读取消息失败:', error); }
  }

  save() {
    fs.writeFileSync(`${this.filePath}.tmp`, JSON.stringify(this.messages, null, 2));
    fs.renameSync(`${this.filePath}.tmp`, this.filePath);
  }

  list() { return this.messages.filter((item) => !item.acknowledgedAt); }

  add(input) {
    const item = {
      id: input.id || crypto.randomUUID(),
      text: input.text.trim(),
      title: (input.title || '').trim(),
      source: (input.source || '').trim(),
      priority: ['low', 'normal', 'high'].includes(input.priority) ? input.priority : 'normal',
      createdAt: new Date().toISOString(),
      acknowledgedAt: null
    };
    this.messages.push(item); this.save(); return item;
  }

  acknowledge(id) {
    const item = this.messages.find((entry) => entry.id === id && !entry.acknowledgedAt);
    if (!item) return null;
    item.acknowledgedAt = new Date().toISOString(); this.save(); return item;
  }
}

module.exports = { MessageStore };
