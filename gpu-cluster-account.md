# 账号
将下面的 "IP 主机名" 写入系统的 **hosts文件**
（Linux和MacOS ：/etc/hosts ，
  Windows      : C:\Windows\System32\drivers\etc\hosts ）

210.28.132.167   n167
210.28.132.168   n168
210.28.132.169   n169
210.28.132.170   n170


Mesos Master : http://n167:5050/      查看集群状态，任务状态，以及任务 stdout 和 stderr 打印的输出
Chronos      : http://n167:4400/      提交和管理作业，查看作业状态。开启了HTTP Basic登录验证
Grafana      : http://n167:3000/      查看监控曲线
Zabbix       : http://n167/zabbix/    也是监控
FTP文件服务   : ftp://n167             管理代码和数据文件
Samba文件服务 : smb://n167:4455/data   管理代码和数据文件

Chronos，FTP和Samba的 **用户名** 均为 `mesos` ，**密码** 均为 `MESOS96ba0602@nju.edu.cn`

JSON配置文件中，"image" 的值 有：
+ n170.njuics.cn:80/ying/dlkit:latest
+ n170.njuics.cn:80/ying/keras:py27-tf14-cpu
+ n170.njuics.cn:80/ying/keras:py27-tf14-gpu

GPU集群使用说明请见 https://github.com/icsnju/dlkit/blob/master/docs/README.md 

# 使用Chronos Restful API提交作业
在客户端，将前面的JSON作业配置示例保存为 dlkit.json （注意，需修改 name ，否则会 **覆盖** 同名作业的配置），然后使用 curl 命令提交POST请求：
```
curl -iL -H "Content-Type: application/json" -H "Authorization: Basic bWVzb3M6TUVTT1M5NmJhMDYwMkBuanUuZWR1LmNu" \
-d @dlkit.json n167:4400/v1/scheduler/iso8601
```

提交后会返回 http/1.1 204 No Content ，这时从Chronos Web UI可以看到添加的作业。
由于设置的 schedule 是未来的时刻，作业需要执行下面的命令手动启动（注意，链接的参数是 作业名）：
```
curl -iL -X PUT -H "Authorization: Basic bWVzb3M6TUVTT1M5NmJhMDYwMkBuanUuZWR1LmNu" \
n167:4400/v1/scheduler/job/dlkit-json
```
提交后会返回 http/1.1 204 No Content ，这时从Chronos Web UI可以看到作业的状态已经转为 QUEUED 或 RUNNING。

`-H "Authorization: Basic bWVzb3M6TUVTT1M5NmJhMDYwMkBuanUuZWR1LmNu" ` 是BASE64编码的Chronos用户名密码，
也可使用 `--user mesos:MESOS96ba0602@nju.edu.cn`，如，获取当前作业列表：
```
curl -s --user mesos:MESOS96ba0602@nju.edu.cn n167:4400/v1/scheduler/jobs | jq
```

`jq` 是JSON格式化工具，可通过 `sudo apt install jq` 安装。

更多Chronos Restful API可参考：https://mesos.github.io/chronos/docs/api.html

# Mesos Restful API

+ 任务列表 http://n167:5050/tasks
+ 框架列表 http://n167:5050/frameworks

http://mesos.apache.org/documentation/latest/endpoints/ 
