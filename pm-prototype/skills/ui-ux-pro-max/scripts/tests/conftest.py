"""让 tests/ 里的用例能 import 上一级 scripts/ 的模块。

pytest 默认只把测试文件所在目录（这里是 tests/）放进 sys.path，
所以 `import core` 会 ModuleNotFoundError。技能是平铺安装的、没有包结构，
不能靠 rootdir 或 -e 安装解决，只能在这里显式补一条路径。
"""
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent.parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
