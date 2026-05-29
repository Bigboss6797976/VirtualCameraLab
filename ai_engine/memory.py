#!/usr/bin/env python3
"""AI 记忆系统"""
import json
import sqlite3
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

@dataclass
class MemoryEntry:
    timestamp: float
    user_id: int
    input_text: str
    intent: str
    entities: Dict
    action_taken: str
    result: str
    energy_cost: int

class MemoryStore:
    """AI 记忆存储"""

    def __init__(self, db_path: str = "data/ai_memory.db"):
        self.db_path = db_path
        self._init_db()
        self.session_context: Dict[int, List[Dict]] = {}

    def _init_db(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                user_id INTEGER,
                input_text TEXT,
                intent TEXT,
                entities TEXT,
                action_taken TEXT,
                result TEXT,
                energy_cost INTEGER
            )
        """)
        conn.commit()
        conn.close()

    def add(self, entry: MemoryEntry):
        """添加记忆"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""
            INSERT INTO memories (timestamp, user_id, input_text, intent, entities, action_taken, result, energy_cost)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            entry.timestamp, entry.user_id, entry.input_text, entry.intent,
            json.dumps(entry.entities), entry.action_taken, entry.result, entry.energy_cost
        ))
        conn.commit()
        conn.close()

        # 更新会话上下文
        if entry.user_id not in self.session_context:
            self.session_context[entry.user_id] = []
        self.session_context[entry.user_id].append({
            'timestamp': entry.timestamp,
            'input': entry.input_text,
            'intent': entry.intent,
            'result': entry.result
        })

        # 限制上下文长度
        if len(self.session_context[entry.user_id]) > 50:
            self.session_context[entry.user_id] = self.session_context[entry.user_id][-50:]

    def get_context(self, user_id: int, limit: int = 10) -> List[Dict]:
        """获取用户上下文"""
        return self.session_context.get(user_id, [])[-limit:]

    def add_context(self, user_id: int, text: str, parse_result: Dict):
        """添加上下文"""
        if user_id not in self.session_context:
            self.session_context[user_id] = []
        self.session_context[user_id].append({
            'timestamp': time.time(),
            'text': text,
            'intent': parse_result.get('intent'),
            'entities': parse_result.get('entities')
        })

    def get_similar_patterns(self, intent: str, limit: int = 5) -> List[Dict]:
        """获取相似模式"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""
            SELECT input_text, action_taken, result, energy_cost
            FROM memories WHERE intent = ? ORDER BY timestamp DESC LIMIT ?
        """, (intent, limit))
        results = c.fetchall()
        conn.close()

        return [
            {
                'input': r[0],
                'action': r[1],
                'result': r[2],
                'energy': r[3]
            }
            for r in results
        ]

    def count(self) -> int:
        """获取记忆数量"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM memories")
        count = c.fetchone()[0]
        conn.close()
        return count

    def get_stats(self) -> Dict:
        """获取统计信息"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute("SELECT intent, COUNT(*) FROM memories GROUP BY intent")
        intents = dict(c.fetchall())

        c.execute("SELECT SUM(energy_cost) FROM memories")
        total_energy = c.fetchone()[0] or 0

        c.execute("SELECT COUNT(DISTINCT user_id) FROM memories")
        unique_users = c.fetchone()[0]

        conn.close()

        return {
            'total_memories': self.count(),
            'intent_distribution': intents,
            'total_energy_consumed': total_energy,
            'unique_users': unique_users
        }
