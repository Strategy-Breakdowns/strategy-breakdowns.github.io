// Demo data: fictional campaigns.
const CAMPAIGNS = [
 {
  "name": "Prestige Pay",
  "sponsor": "Tyrell Pay",
  "items": [
   {
    "t": "Ad 1",
    "date": "Nov 9",
    "s": "todo",
    "url": "https://demo.invalid/173aws"
   },
   {
    "t": "Ad 2",
    "date": "Nov 17",
    "s": "todo",
    "url": "https://demo.invalid/3czox"
   },
   {
    "t": "Ad 3",
    "date": "Nov 30",
    "s": "todo",
    "url": "https://demo.invalid/vi7tv"
   },
   {
    "t": "Comment",
    "date": "Dec 1",
    "s": "todo",
    "url": "https://demo.invalid/e1avv"
   },
   {
    "t": "Retarget",
    "date": "Dec 1",
    "s": "todo",
    "url": "https://demo.invalid/5dv38"
   },
   {
    "t": "Ad 4",
    "date": "Dec 15",
    "s": "todo",
    "url": "https://demo.invalid/ahxui"
   },
   {
    "t": "Domain Ins.",
    "date": "Dec 31",
    "s": "todo",
    "url": "https://demo.invalid/6zei5"
   },
   {
    "t": "Ad 5",
    "date": "Jan 4",
    "s": "todo",
    "url": "https://demo.invalid/iqpyl"
   },
   {
    "t": "Ad 6",
    "date": "Jan 13",
    "s": "todo",
    "url": "https://demo.invalid/qy7mb"
   },
   {
    "t": "Breakdown",
    "date": "Jan 27",
    "s": "todo",
    "url": "https://demo.invalid/1nhqmz"
   },
   {
    "t": "LI 1",
    "date": "Jan 28",
    "s": "todo",
    "url": "https://demo.invalid/93f38"
   },
   {
    "t": "X 1",
    "date": "Jan 28",
    "s": "todo",
    "url": "https://demo.invalid/16t2q3"
   },
   {
    "t": "Domain Ins.",
    "date": "Jan 31",
    "s": "todo",
    "url": "https://demo.invalid/yqx6d"
   },
   {
    "t": "Ad 7",
    "date": "Feb 3",
    "s": "todo",
    "url": "https://demo.invalid/9rbro"
   },
   {
    "t": "Ad 8",
    "date": "Feb 18",
    "s": "todo",
    "url": "https://demo.invalid/1g22t3"
   },
   {
    "t": "Domain Ins.",
    "date": "Feb 28",
    "s": "todo",
    "url": "https://demo.invalid/tqg7d"
   },
   {
    "t": "Ad 9",
    "date": "Mar 3",
    "s": "todo",
    "url": "https://demo.invalid/xmxs3"
   },
   {
    "t": "Breakdown",
    "date": "Mar 17",
    "s": "todo",
    "url": "https://demo.invalid/1jjeh2"
   },
   {
    "t": "LI 2",
    "date": "Mar 18",
    "s": "todo",
    "url": "https://demo.invalid/1lmmp0"
   },
   {
    "t": "X 2",
    "date": "Mar 18",
    "s": "todo",
    "url": "https://demo.invalid/1lmcpn"
   },
   {
    "t": "Ad 10",
    "date": "Mar 30",
    "s": "todo",
    "url": "https://demo.invalid/1mvve1"
   },
   {
    "t": "Domain Ins.",
    "date": "Mar 31",
    "s": "todo",
    "url": "https://demo.invalid/4ji0r"
   },
   {
    "t": "Ad 11",
    "date": "Apr 7",
    "s": "todo",
    "url": "https://demo.invalid/elckv"
   },
   {
    "t": "Domain Ins.",
    "date": "Apr 30",
    "s": "todo",
    "url": "https://demo.invalid/8po4t"
   },
   {
    "t": "Ad 12",
    "date": "May 5",
    "s": "todo",
    "url": "https://demo.invalid/xlerc"
   },
   {
    "t": "SB 1 Rerun",
    "date": "May 23",
    "s": "todo",
    "url": "https://demo.invalid/2ci3f"
   },
   {
    "t": "Domain Ins.",
    "date": "May 31",
    "s": "todo",
    "url": "https://demo.invalid/hs95o"
   },
   {
    "t": "SB 2 Rerun",
    "date": "Jul 11",
    "s": "todo",
    "url": "https://demo.invalid/10v7rj"
   }
  ]
 },
 {
  "name": "Globex Health",
  "sponsor": "Virtucon Cloud",
  "items": [
   {
    "t": "X 1",
    "date": "Sep 3",
    "s": "done",
    "url": "https://demo.invalid/s6hl"
   },
   {
    "t": "LI 1",
    "date": "Sep 3",
    "s": "done",
    "url": "https://demo.invalid/3sbz6"
   },
   {
    "t": "Ad 1",
    "date": "Sep 16",
    "s": "done",
    "url": "https://demo.invalid/1ifwhn"
   },
   {
    "t": "X 2",
    "date": "Sep 24",
    "s": "done",
    "url": "https://demo.invalid/ib1rg"
   },
   {
    "t": "LI 2",
    "date": "Sep 24",
    "s": "done",
    "url": "https://demo.invalid/44z2u"
   },
   {
    "t": "Domain Ins.",
    "date": "Sep 30",
    "s": "todo",
    "url": "https://demo.invalid/145bwx"
   },
   {
    "t": "Ad 2",
    "date": "Oct 11",
    "s": "done",
    "url": "https://demo.invalid/7zkc9"
   },
   {
    "t": "X 3",
    "date": "Oct 13",
    "s": "done",
    "url": "https://demo.invalid/1jc2ey"
   },
   {
    "t": "LI 3",
    "date": "Oct 13",
    "s": "done",
    "url": "https://demo.invalid/ld2ue"
   },
   {
    "t": "Ad 3",
    "date": "Oct 18",
    "s": "done",
    "url": "https://demo.invalid/1408dd"
   },
   {
    "t": "Daily Bonus Ad 1",
    "date": "Oct 23",
    "s": "done",
    "url": "https://demo.invalid/174xo1"
   },
   {
    "t": "Ad 4",
    "date": "Oct 25",
    "s": "active",
    "url": "https://demo.invalid/t69s4"
   },
   {
    "t": "Retarget",
    "date": "Oct 28",
    "s": "done",
    "url": "https://demo.invalid/1g0nj0"
   },
   {
    "t": "Breakdown",
    "date": "Oct 28",
    "s": "active",
    "url": "https://demo.invalid/1f0570"
   },
   {
    "t": "Ad 5",
    "date": "Nov 1",
    "s": "active",
    "url": "https://demo.invalid/1mf92j"
   },
   {
    "t": "X 4",
    "date": "Nov 4",
    "s": "active",
    "url": "https://demo.invalid/8f80o"
   },
   {
    "t": "LI 4",
    "date": "Nov 4",
    "s": "active",
    "url": "https://demo.invalid/1kct8y"
   },
   {
    "t": "Ad 6",
    "date": "Nov 8",
    "s": "active",
    "url": "https://demo.invalid/7got2"
   },
   {
    "t": "Ad 7",
    "date": "Nov 12",
    "s": "todo",
    "url": "https://demo.invalid/1nbllw"
   },
   {
    "t": "Ad 8",
    "date": "Nov 15",
    "s": "todo",
    "url": "https://demo.invalid/18otrj"
   },
   {
    "t": "Ad 9",
    "date": "Nov 19",
    "s": "todo",
    "url": "https://demo.invalid/atv3y"
   },
   {
    "t": "X 5",
    "date": "Nov 24",
    "s": "todo",
    "url": "https://demo.invalid/19k2e3"
   },
   {
    "t": "LI 5",
    "date": "Nov 24",
    "s": "active",
    "url": "https://demo.invalid/drihs"
   },
   {
    "t": "Ad 10",
    "date": "Nov 25",
    "s": "todo",
    "url": "https://demo.invalid/1f1i9u"
   },
   {
    "t": "Ad 11",
    "date": "Dec 16",
    "s": "todo",
    "url": "https://demo.invalid/316h"
   },
   {
    "t": "X 6",
    "date": "Dec 17",
    "s": "todo",
    "url": "https://demo.invalid/1iubfn"
   },
   {
    "t": "LI 6",
    "date": "Dec 17",
    "s": "todo",
    "url": "https://demo.invalid/f13kg"
   },
   {
    "t": "Breakdown",
    "date": "Jan 20",
    "s": "todo",
    "url": "https://demo.invalid/e1e7t"
   },
   {
    "t": "Ad 12",
    "date": "Jan 20",
    "s": "todo",
    "url": "https://demo.invalid/z7lf9"
   },
   {
    "t": "X 7",
    "date": "Jan 21",
    "s": "todo",
    "url": "https://demo.invalid/1e4cz5"
   },
   {
    "t": "LI 7",
    "date": "Jan 21",
    "s": "todo",
    "url": "https://demo.invalid/16zq6r"
   },
   {
    "t": "SB 1 Rerun",
    "date": "Jan 28",
    "s": "todo",
    "url": "https://demo.invalid/12toma"
   },
   {
    "t": "X 8",
    "date": "Feb 4",
    "s": "todo",
    "url": "https://demo.invalid/1f1qg3"
   },
   {
    "t": "LI 8",
    "date": "Feb 4",
    "s": "todo",
    "url": "https://demo.invalid/9a18u"
   },
   {
    "t": "SB 2 Rerun",
    "date": "Apr 17",
    "s": "todo",
    "url": "https://demo.invalid/9mju"
   }
  ]
 },
 {
  "name": "Omni Consumer",
  "sponsor": "Virtucon Cloud",
  "items": [
   {
    "t": "Newsletter Bonus 1",
    "date": "Oct 9",
    "s": "done",
    "url": "https://demo.invalid/ulmax"
   },
   {
    "t": "X 1",
    "date": "Nov 5",
    "s": "active",
    "url": "https://demo.invalid/77nue"
   },
   {
    "t": "LI 1",
    "date": "Nov 5",
    "s": "active",
    "url": "https://demo.invalid/1es93p"
   },
   {
    "t": "Ad 1",
    "date": "Nov 12",
    "s": "active",
    "url": "https://demo.invalid/1jjs49"
   },
   {
    "t": "X 4",
    "date": "Nov 18",
    "s": "todo",
    "url": "https://demo.invalid/zqbzv"
   },
   {
    "t": "LI 4",
    "date": "Nov 18",
    "s": "todo",
    "url": "https://demo.invalid/5owds"
   },
   {
    "t": "Breakdown",
    "date": "Nov 18",
    "s": "todo",
    "url": "https://demo.invalid/xnu5u"
   },
   {
    "t": "Ad 2",
    "date": "Nov 23",
    "s": "todo",
    "url": "https://demo.invalid/18mwcm"
   },
   {
    "t": "X 2",
    "date": "Dec 3",
    "s": "todo",
    "url": "https://demo.invalid/2ipfm"
   },
   {
    "t": "LI 2",
    "date": "Dec 3",
    "s": "todo",
    "url": "https://demo.invalid/qmlvc"
   },
   {
    "t": "Ad 3",
    "date": "Jan 6",
    "s": "todo",
    "url": "https://demo.invalid/6wspu"
   },
   {
    "t": "X 3",
    "date": "Jan 7",
    "s": "todo",
    "url": "https://demo.invalid/6xozu"
   },
   {
    "t": "LI 3",
    "date": "Jan 7",
    "s": "todo",
    "url": "https://demo.invalid/r1ink"
   },
   {
    "t": "Ad 4",
    "date": "Jan 20",
    "s": "todo",
    "url": "https://demo.invalid/cvp7n"
   },
   {
    "t": "X 5",
    "date": "Jan 21",
    "s": "todo",
    "url": "https://demo.invalid/184m0u"
   },
   {
    "t": "LI 5",
    "date": "Jan 21",
    "s": "todo",
    "url": "https://demo.invalid/12mrdk"
   },
   {
    "t": "Rerun",
    "date": "Feb 17",
    "s": "todo",
    "url": "https://demo.invalid/19u7qq"
   }
  ]
 },
 {
  "name": "Initech",
  "sponsor": "Monsters Labs",
  "items": [
   {
    "t": "Ad 1",
    "date": "Oct 9",
    "s": "done",
    "url": "https://demo.invalid/94563"
   },
   {
    "t": "Breakdown",
    "date": "Oct 14",
    "s": "done",
    "url": "https://demo.invalid/6wqwq"
   },
   {
    "t": "X 1",
    "date": "Oct 15",
    "s": "done",
    "url": "https://demo.invalid/8nczi"
   },
   {
    "t": "LI 1",
    "date": "Oct 15",
    "s": "done",
    "url": "https://demo.invalid/sesnn"
   },
   {
    "t": "Ad 2",
    "date": "Oct 21",
    "s": "done",
    "url": "https://demo.invalid/1jkj96"
   },
   {
    "t": "Ad 3",
    "date": "Oct 28",
    "s": "active",
    "url": "https://demo.invalid/dr7t"
   },
   {
    "t": "Ad 4",
    "date": "Nov 18",
    "s": "todo",
    "url": "https://demo.invalid/ydv9o"
   },
   {
    "t": "Ad 5",
    "date": "Dec 2",
    "s": "todo",
    "url": "https://demo.invalid/2lpdo"
   },
   {
    "t": "Ad 6",
    "date": "Dec 16",
    "s": "todo",
    "url": "https://demo.invalid/10zskh"
   }
  ]
 },
 {
  "name": "Abstergo",
  "sponsor": "Omni Health",
  "items": [
   {
    "t": "Ad 1",
    "date": "Oct 18",
    "s": "done",
    "url": "https://demo.invalid/fuspv"
   },
   {
    "t": "Ad 2",
    "date": "Nov 8",
    "s": "active",
    "url": "https://demo.invalid/191wyb"
   },
   {
    "t": "Ad 3",
    "date": "Nov 11",
    "s": "active",
    "url": "https://demo.invalid/324hd"
   },
   {
    "t": "Ad 4",
    "date": "Nov 15",
    "s": "active",
    "url": "https://demo.invalid/r567v"
   },
   {
    "t": "Ad 5",
    "date": "Nov 20",
    "s": "todo",
    "url": "https://demo.invalid/160psy"
   },
   {
    "t": "Ad 6",
    "date": "Nov 24",
    "s": "todo",
    "url": "https://demo.invalid/149ypc"
   },
   {
    "t": "Ad 7",
    "date": "Nov 30",
    "s": "todo",
    "url": "https://demo.invalid/icwe7"
   },
   {
    "t": "Ad 8",
    "date": "Dec 9",
    "s": "todo",
    "url": "https://demo.invalid/qpikx"
   }
  ]
 },
 {
  "name": "Mooby",
  "sponsor": "Virtucon Cloud",
  "items": [
   {
    "t": "Ad 1",
    "date": "Oct 14",
    "s": "done",
    "url": "https://demo.invalid/9o6xl"
   },
   {
    "t": "Ad 2",
    "date": "Nov 4",
    "s": "active",
    "url": "https://demo.invalid/to1f9"
   },
   {
    "t": "Ad 3",
    "date": "Nov 11",
    "s": "active",
    "url": "https://demo.invalid/bakri"
   },
   {
    "t": "Ad 4",
    "date": "Nov 25",
    "s": "todo",
    "url": "https://demo.invalid/k8uu2"
   }
  ]
 },
 {
  "name": "Pied Piper",
  "sponsor": "Monsters Labs",
  "items": [
   {
    "t": "Ad 1",
    "date": "Sep 2",
    "s": "done",
    "url": "https://demo.invalid/4p8sq"
   },
   {
    "t": "X 1",
    "date": "Sep 16",
    "s": "done",
    "url": "https://demo.invalid/yudxk"
   },
   {
    "t": "Breakdown",
    "date": "Sep 16",
    "s": "done",
    "url": "https://demo.invalid/1fu9yy"
   },
   {
    "t": "LI 1",
    "date": "Sep 16",
    "s": "done",
    "url": "https://demo.invalid/dwbf0"
   },
   {
    "t": "Ad 2",
    "date": "Sep 23",
    "s": "done",
    "url": "https://demo.invalid/1jficx"
   },
   {
    "t": "Ad 3",
    "date": "Sep 30",
    "s": "done",
    "url": "https://demo.invalid/db56e"
   },
   {
    "t": "Ad 4",
    "date": "Oct 5",
    "s": "done",
    "url": "https://demo.invalid/86sys"
   },
   {
    "t": "Ad 5",
    "date": "Oct 11",
    "s": "done",
    "url": "https://demo.invalid/a9f5k"
   },
   {
    "t": "Ad 6",
    "date": "Oct 14",
    "s": "done",
    "url": "https://demo.invalid/glks8"
   },
   {
    "t": "Ad 7",
    "date": "Nov 1",
    "s": "active",
    "url": "https://demo.invalid/hv0q6"
   },
   {
    "t": "Ad 8",
    "date": "Nov 4",
    "s": "active",
    "url": "https://demo.invalid/n2kch"
   },
   {
    "t": "Rerun",
    "date": "Dec 9",
    "s": "active",
    "url": "https://demo.invalid/1hboz5"
   }
  ]
 },
 {
  "name": "Globex",
  "sponsor": "Virtucon Cloud",
  "items": [
   {
    "t": "X 1",
    "date": "Oct 1",
    "s": "done",
    "url": "https://demo.invalid/lee77"
   },
   {
    "t": "LI 1",
    "date": "Oct 1",
    "s": "done",
    "url": "https://demo.invalid/ackig"
   },
   {
    "t": "Daily Bonus Ad 1",
    "date": "Oct 22",
    "s": "done",
    "url": "https://demo.invalid/i827p"
   },
   {
    "t": "X 2",
    "date": "Oct 29",
    "s": "active",
    "url": "https://demo.invalid/ixqn"
   },
   {
    "t": "LI 2",
    "date": "Oct 29",
    "s": "active",
    "url": "https://demo.invalid/1j66rw"
   },
   {
    "t": "X 3",
    "date": "Nov 19",
    "s": "todo",
    "url": "https://demo.invalid/vuoq7"
   },
   {
    "t": "LI 3",
    "date": "Nov 19",
    "s": "todo",
    "url": "https://demo.invalid/ybetw"
   }
  ]
 },
 {
  "name": "Cyberdyne",
  "sponsor": "Monsters Labs",
  "items": [
   {
    "t": "Breakdown",
    "date": "Nov 11",
    "s": "active",
    "url": "https://demo.invalid/1bvv2n"
   }
  ]
 },
 {
  "name": "Strickland Propane",
  "sponsor": "Monsters Labs",
  "items": [
   {
    "t": "Ad 2",
    "date": "Oct 24",
    "s": "active",
    "url": "https://demo.invalid/zvs0c"
   }
  ]
 },
 {
  "name": "Massive Dynamic",
  "sponsor": "Strickland AI",
  "items": [
   {
    "t": "Ad 1",
    "date": "Oct 19",
    "s": "done",
    "url": "https://demo.invalid/6xf9u"
   },
   {
    "t": "Ad 2",
    "date": "Oct 20",
    "s": "done",
    "url": "https://demo.invalid/hn598"
   },
   {
    "t": "Ad 3",
    "date": "Oct 22",
    "s": "done",
    "url": "https://demo.invalid/rcwg3"
   },
   {
    "t": "Ad 4",
    "date": "Oct 23",
    "s": "done",
    "url": "https://demo.invalid/p13g6"
   },
   {
    "t": "Ad 5",
    "date": "Oct 24",
    "s": "active",
    "url": "https://demo.invalid/zmqz4"
   },
   {
    "t": "Ad 6",
    "date": "Oct 25",
    "s": "active",
    "url": "https://demo.invalid/180ku2"
   }
  ]
 },
 {
  "name": "Wonka",
  "sponsor": "Pied AI",
  "items": [
   {
    "t": "Ad 2",
    "date": "Jul 1",
    "s": "done",
    "url": "https://demo.invalid/1ag42l"
   },
   {
    "t": "Retarget",
    "date": "Jul 2",
    "s": "done",
    "url": "https://demo.invalid/15r4zg"
   },
   {
    "t": "Domain Ins.",
    "date": "Jul 9",
    "s": "done",
    "url": "https://demo.invalid/ba0mc"
   },
   {
    "t": "Ad 4",
    "date": "Jul 29",
    "s": "done",
    "url": "https://demo.invalid/8a7uh"
   },
   {
    "t": "Ad 3",
    "date": "Aug 2",
    "s": "done",
    "url": "https://demo.invalid/es5ss"
   },
   {
    "t": "Domain Ins.",
    "date": "Aug 4",
    "s": "done",
    "url": "https://demo.invalid/1e59wf"
   },
   {
    "t": "Ad 5",
    "date": "Aug 12",
    "s": "done",
    "url": "https://demo.invalid/wm2fd"
   },
   {
    "t": "Ad 6",
    "date": "Aug 23",
    "s": "done",
    "url": "https://demo.invalid/1kexy"
   },
   {
    "t": "Domain Ins.",
    "date": "Aug 31",
    "s": "done",
    "url": "https://demo.invalid/ukla9"
   },
   {
    "t": "Ad 7",
    "date": "Sep 6",
    "s": "done",
    "url": "https://demo.invalid/cpi64"
   },
   {
    "t": "Ad 8",
    "date": "Sep 17",
    "s": "done",
    "url": "https://demo.invalid/ixwjy"
   },
   {
    "t": "Ad 9",
    "date": "Sep 29",
    "s": "done",
    "url": "https://demo.invalid/1b9ngw"
   },
   {
    "t": "Domain Ins.",
    "date": "Sep 30",
    "s": "todo",
    "url": "https://demo.invalid/1bxcrg"
   },
   {
    "t": "Ad 10",
    "date": "Oct 9",
    "s": "done",
    "url": "https://demo.invalid/1m2lg8"
   },
   {
    "t": "Ad 11",
    "date": "Oct 21",
    "s": "done",
    "url": "https://demo.invalid/o9dvz"
   },
   {
    "t": "Ad 12",
    "date": "Oct 28",
    "s": "active",
    "url": "https://demo.invalid/4cwa5"
   },
   {
    "t": "Ad 13",
    "date": "Nov 14",
    "s": "active",
    "url": "https://demo.invalid/10na9x"
   },
   {
    "t": "Ad 14",
    "date": "Nov 18",
    "s": "todo",
    "url": "https://demo.invalid/k9fuv"
   },
   {
    "t": "Ad 15",
    "date": "Nov 22",
    "s": "todo",
    "url": "https://demo.invalid/f8aho"
   },
   {
    "t": "Ad 16",
    "date": "Dec 2",
    "s": "todo",
    "url": "https://demo.invalid/1596g0"
   },
   {
    "t": "Ad 17",
    "date": "Dec 6",
    "s": "todo",
    "url": "https://demo.invalid/huyxe"
   },
   {
    "t": "Ad 18",
    "date": "Dec 9",
    "s": "todo",
    "url": "https://demo.invalid/ivfbc"
   },
   {
    "t": "Ad 19",
    "date": "Jan 4",
    "s": "todo",
    "url": "https://demo.invalid/a46i3"
   },
   {
    "t": "Ad 20",
    "date": "Jan 13",
    "s": "todo",
    "url": "https://demo.invalid/qwyre"
   },
   {
    "t": "Ad 21",
    "date": "Jan 24",
    "s": "todo",
    "url": "https://demo.invalid/ficr0"
   }
  ]
 }
];
