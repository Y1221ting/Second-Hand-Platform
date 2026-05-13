import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import FormField from "./FormField";

const provinceCityMap = {
  "北京": ["东城区", "西城区", "朝阳区", "海淀区", "丰台区", "石景山区", "通州区", "顺义区", "昌平区", "大兴区", "房山区", "门头沟区", "平谷区", "怀柔区", "密云区", "延庆区"],
  "上海": ["黄浦区", "徐汇区", "长宁区", "静安区", "普陀区", "虹口区", "杨浦区", "闵行区", "宝山区", "嘉定区", "浦东新区", "金山区", "松江区", "青浦区", "奉贤区", "崇明区"],
  "广东": ["广州", "深圳", "珠海", "汕头", "佛山", "韶关", "湛江", "肇庆", "江门", "茂名", "惠州", "梅州", "汕尾", "河源", "阳江", "清远", "东莞", "中山", "潮州", "揭阳", "云浮"],
  "江苏": ["南京", "无锡", "徐州", "常州", "苏州", "南通", "连云港", "淮安", "盐城", "扬州", "镇江", "泰州", "宿迁"],
  "浙江": ["杭州", "宁波", "温州", "嘉兴", "湖州", "绍兴", "金华", "衢州", "舟山", "台州", "丽水"],
  "山东": ["济南", "青岛", "淄博", "枣庄", "东营", "烟台", "潍坊", "济宁", "泰安", "威海", "日照", "临沂", "德州", "聊城", "滨州", "菏泽"],
  "四川": ["成都", "自贡", "攀枝花", "泸州", "德阳", "绵阳", "广元", "遂宁", "内江", "乐山", "南充", "眉山", "宜宾", "广安", "达州", "雅安", "巴中", "资阳"],
  "湖北": ["武汉", "黄石", "十堰", "宜昌", "襄阳", "鄂州", "荆门", "孝感", "荆州", "黄冈", "咸宁", "随州", "恩施"],
  "湖南": ["长沙", "株洲", "湘潭", "衡阳", "邵阳", "岳阳", "常德", "张家界", "益阳", "郴州", "永州", "怀化", "娄底", "湘西"],
  "河南": ["郑州", "开封", "洛阳", "平顶山", "安阳", "鹤壁", "新乡", "焦作", "濮阳", "许昌", "漯河", "三门峡", "南阳", "商丘", "信阳", "周口", "驻马店"],
  "河北": ["石家庄", "唐山", "秦皇岛", "邯郸", "邢台", "保定", "张家口", "承德", "沧州", "廊坊", "衡水"],
  "福建": ["福州", "厦门", "莆田", "三明", "泉州", "漳州", "南平", "龙岩", "宁德"],
  "安徽": ["合肥", "芜湖", "蚌埠", "淮南", "马鞍山", "淮北", "铜陵", "安庆", "黄山", "滁州", "阜阳", "宿州", "六安", "亳州", "池州", "宣城"],
  "江西": ["南昌", "景德镇", "萍乡", "九江", "新余", "鹰潭", "赣州", "吉安", "宜春", "抚州", "上饶"],
  "陕西": ["西安", "铜川", "宝鸡", "咸阳", "渭南", "延安", "汉中", "榆林", "安康", "商洛"],
  "辽宁": ["沈阳", "大连", "鞍山", "抚顺", "本溪", "丹东", "锦州", "营口", "阜新", "辽阳", "盘锦", "铁岭", "朝阳", "葫芦岛"],
  "黑龙江": ["哈尔滨", "齐齐哈尔", "鸡西", "鹤岗", "双鸭山", "大庆", "伊春", "佳木斯", "七台河", "牡丹江", "黑河", "绥化", "大兴安岭"],
  "吉林": ["长春", "吉林", "四平", "辽源", "通化", "白山", "松原", "白城", "延边"],
  "云南": ["昆明", "曲靖", "玉溪", "保山", "昭通", "丽江", "普洱", "临沧", "楚雄", "红河", "文山", "西双版纳", "大理", "德宏", "怒江", "迪庆"],
  "贵州": ["贵阳", "六盘水", "遵义", "安顺", "毕节", "铜仁", "黔西南", "黔东南", "黔南"],
  "甘肃": ["兰州", "嘉峪关", "金昌", "白银", "天水", "武威", "张掖", "平凉", "酒泉", "庆阳", "定西", "陇南", "临夏", "甘南"],
  "山西": ["太原", "大同", "阳泉", "长治", "晋城", "朔州", "晋中", "运城", "忻州", "临汾", "吕梁"],
  "内蒙古": ["呼和浩特", "包头", "乌海", "赤峰", "通辽", "鄂尔多斯", "呼伦贝尔", "巴彦淖尔", "乌兰察布", "兴安盟", "锡林郭勒盟", "阿拉善盟"],
  "广西": ["南宁", "柳州", "桂林", "梧州", "北海", "防城港", "钦州", "贵港", "玉林", "百色", "贺州", "河池", "来宾", "崇左"],
  "海南": ["海口", "三亚", "三沙", "儋州", "五指山", "琼海", "文昌", "万宁", "东方", "定安", "屯昌", "澄迈", "临高", "白沙", "昌江", "乐东", "陵水", "保亭", "琼中"],
  "重庆": ["渝中区", "大渡口区", "江北区", "沙坪坝区", "九龙坡区", "南岸区", "北碚区", "綦江区", "大足区", "渝北区", "巴南区", "黔江区", "长寿区", "江津区", "合川区", "永川区", "南川区", "璧山区", "铜梁区", "潼南区", "荣昌区", "开州区", "梁平区", "武隆区"],
  "西藏": ["拉萨", "日喀则", "昌都", "林芝", "山南", "那曲", "阿里"],
  "宁夏": ["银川", "石嘴山", "吴忠", "固原", "中卫"],
  "新疆": ["乌鲁木齐", "克拉玛依", "吐鲁番", "哈密", "昌吉", "博尔塔拉", "巴音郭楞", "阿克苏", "克孜勒苏", "喀什", "和田", "伊犁", "塔城", "阿勒泰"],
  "青海": ["西宁", "海东", "海北", "黄南", "海南", "果洛", "玉树", "海西"],
};

const Dialog = ({ isOpen, onClose, onSave, id }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    college: "",
    phoneNo: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [availableCities, setAvailableCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors({ ...formErrors, [name]: value.trim() === "" });
  };

  const handleProvinceChange = (e) => {
    const province = e.target.value;
    setFormData({ ...formData, state: province, city: "" });
    setAvailableCities(provinceCityMap[province] || []);
  };

  const handleSave = () => {
    const isFormValid = Object.values(formData).every((value) => value.trim() !== "");

    if (isFormValid) {
      onSave(formData);
    } else {
      console.error("请填写所有必填字段。");
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!id) {
        setFetchError("用户ID无效");
        setLoading(false);
        return;
      }
      setLoading(true);
      setFetchError("");
      try {
        const response = await fetch(
          `/api/users/${id}`
        );
        if (response.ok) {
          const userData = await response.json();
          setFormData({
            fullName: userData.fullName || "",
            email: userData.email || "",
            college: userData.college || "",
            phoneNo: userData.phoneNo || "",
            address: userData.address || "",
            city: userData.city || "",
            state: userData.state || "",
            zipCode: userData.zipCode || "",
          });
          if (userData.state && provinceCityMap[userData.state]) {
            setAvailableCities(provinceCityMap[userData.state]);
          }
        } else if (response.status === 404) {
          setFetchError("未找到用户信息，请重新登录");
        } else {
          setFetchError("获取用户信息失败");
        }
      } catch (error) {
        console.error(error);
        setFetchError("网络错误，请检查连接");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUserDetails();
    }
  }, [id, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="dialog-overlay bg-gray-800 opacity-50 absolute inset-0"></div>
      <div className="dialog-content bg-white p-8 rounded-lg shadow-lg z-50 w-full md:w-1/2">
        <button
          className="absolute top-2 right-2 text-gray-700"
          onClick={onClose}
        >
          <FaTimes />
        </button>
        <h2 className="text-2xl font-semibold mb-4">确认收货信息</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">加载中...</p>
          </div>
        ) : fetchError ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{fetchError}</p>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
            >
              关闭
            </button>
          </div>
        ) : (
        <form className="dialog-form">
          <div className="flex flex-col md:flex-row w-full justify-between">
            <div className="w-full md:w-1/2 mr-1">
              <FormField
                label="姓名"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                error={formErrors.fullName}
              />
              <FormField
                label="邮箱"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={formErrors.email}
              />
              <FormField
                label="学校"
                name="college"
                type="text"
                value={formData.college}
                onChange={handleInputChange}
                error={formErrors.college}
              />
              <FormField
                label="手机号"
                name="phoneNo"
                type="tel"
                value={formData.phoneNo}
                onChange={handleInputChange}
                error={formErrors.phoneNo}
              />
            </div>
            <div className="w-full md:w-1/2 ml-1">
              <FormField
                label="地址"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                error={formErrors.address}
              />
              <div className="mb-3">
                <label className="block text-gray-600 mb-1">省份</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleProvinceChange}
                  className="w-full border rounded-lg py-2 px-3"
                  required
                >
                  <option value="">请选择省份</option>
                  {Object.keys(provinceCityMap).map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-gray-600 mb-1">城市</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg py-2 px-3"
                  required
                  disabled={!formData.state}
                >
                  <option value="">请选择城市</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <FormField
                label="邮编"
                name="zipCode"
                type="text"
                value={formData.zipCode}
                onChange={handleInputChange}
                error={formErrors.zipCode}
              />
            </div>
          </div>
          <div className="flex justify-around">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 md:w-1/4 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-800 transition duration-300"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-1/3 md:w-1/4 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-800 transition duration-300"
            >
              确认
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default Dialog;
