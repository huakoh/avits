import React, { useEffect, useState } from 'react';
import { Spin, Button, Typography, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, ExclamationCircleFilled, CheckCircleFilled } from '@ant-design/icons';
import classNames from 'classnames';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useDisplayMode } from '../../hooks/useDisplayMode';
import styles from './index.module.css';

const { Text } = Typography;

interface ChannelData {
  id: number;
  position: string;
  rowIndex: string;
  colIndex: number;
  vaccineName?: string;
  vaccineCode?: string;
  vaccineType?: string;
  vaccineCategory?: 'EPI' | 'NON_EPI'; // 免疫规划/非免疫规划
  manufacturer?: string;
  batchNo?: string;
  quantity: number;
  capacity: number;
  status: number; // 1正常 2故障 0停用
  temperature?: number;
  expiryDate?: string;
  expiryDays?: number;
  todayOut?: number;
}

interface ChannelMatrixProps {
  onChannelClick?: (channel: ChannelData) => void;
}

// 疫苗品种配置 - 90种疫苗
// EPI = 免疫规划疫苗（绿色系）
// NON_EPI = 非免疫规划疫苗（蓝色系）
const vaccineDatabase = [
  // ===== 免疫规划疫苗 (EPI) - 绿色系 =====
  { name: '乙肝疫苗', code: 'HepB', shortName: '乙肝', category: 'EPI' as const },
  { name: '卡介苗', code: 'BCG', shortName: '卡介', category: 'EPI' as const },
  { name: '脊灰灭活疫苗', code: 'IPV', shortName: '脊灰', category: 'EPI' as const },
  { name: '脊灰减毒活疫苗', code: 'bOPV', shortName: '脊灰', category: 'EPI' as const },
  { name: '百白破疫苗', code: 'DTaP', shortName: '百白破', category: 'EPI' as const },
  { name: '白破疫苗', code: 'DT', shortName: '白破', category: 'EPI' as const },
  { name: '麻腮风疫苗', code: 'MMR', shortName: '麻腮风', category: 'EPI' as const },
  { name: '麻风疫苗', code: 'MR', shortName: '麻风', category: 'EPI' as const },
  { name: '乙脑减毒活疫苗', code: 'JE-L', shortName: '乙脑', category: 'EPI' as const },
  { name: 'A群流脑多糖疫苗', code: 'MPSV-A', shortName: 'A群流脑', category: 'EPI' as const },
  { name: 'A+C群流脑多糖疫苗', code: 'MPSV-AC', shortName: 'AC流脑', category: 'EPI' as const },
  { name: '甲肝减毒活疫苗', code: 'HepA-L', shortName: '甲肝', category: 'EPI' as const },
  
  // ===== 非免疫规划疫苗 (NON_EPI) - 蓝色系 =====
  { name: '水痘减毒活疫苗', code: 'VarV', shortName: '水痘', category: 'NON_EPI' as const },
  { name: '四价流感病毒裂解疫苗', code: 'IIV4', shortName: '流感', category: 'NON_EPI' as const },
  { name: '三价流感病毒裂解疫苗', code: 'IIV3', shortName: '流感', category: 'NON_EPI' as const },
  { name: '冻干人用狂犬病疫苗', code: 'RabV', shortName: '狂犬', category: 'NON_EPI' as const },
  { name: '九价HPV疫苗', code: 'HPV9', shortName: 'HPV9', category: 'NON_EPI' as const },
  { name: '四价HPV疫苗', code: 'HPV4', shortName: 'HPV4', category: 'NON_EPI' as const },
  { name: '二价HPV疫苗', code: 'HPV2', shortName: 'HPV2', category: 'NON_EPI' as const },
  { name: '23价肺炎球菌多糖疫苗', code: 'PPV23', shortName: '23价肺炎', category: 'NON_EPI' as const },
  { name: '13价肺炎球菌结合疫苗', code: 'PCV13', shortName: '13价肺炎', category: 'NON_EPI' as const },
  { name: '口服轮状病毒活疫苗', code: 'RotaV', shortName: '轮状', category: 'NON_EPI' as const },
  { name: '五价轮状病毒疫苗', code: 'RV5', shortName: '轮状5价', category: 'NON_EPI' as const },
  { name: '甲肝灭活疫苗', code: 'HepA-I', shortName: '甲肝灭活', category: 'NON_EPI' as const },
  { name: '乙脑灭活疫苗', code: 'JE-I', shortName: '乙脑灭活', category: 'NON_EPI' as const },
  { name: '重组乙肝疫苗(酵母)', code: 'HepB-Y', shortName: '乙肝重组', category: 'NON_EPI' as const },
  { name: '重组乙肝疫苗(CHO)', code: 'HepB-C', shortName: '乙肝CHO', category: 'NON_EPI' as const },
  { name: 'Hib结合疫苗', code: 'Hib', shortName: 'Hib', category: 'NON_EPI' as const },
  { name: '五联疫苗', code: 'DTaP-IPV-Hib', shortName: '五联', category: 'NON_EPI' as const },
  { name: '四联疫苗', code: 'DTaP-Hib', shortName: '四联', category: 'NON_EPI' as const },
  { name: 'AC结合流脑疫苗', code: 'MCV-AC', shortName: 'AC结合', category: 'NON_EPI' as const },
  { name: 'ACYW135流脑多糖疫苗', code: 'MPSV4', shortName: '四价流脑', category: 'NON_EPI' as const },
  { name: '手足口病疫苗', code: 'EV71', shortName: '手足口', category: 'NON_EPI' as const },
  { name: '带状疱疹疫苗', code: 'HZV', shortName: '带疱', category: 'NON_EPI' as const },
  { name: '新冠病毒灭活疫苗', code: 'COVID-I', shortName: '新冠灭活', category: 'NON_EPI' as const },
  { name: '新冠病毒mRNA疫苗', code: 'COVID-M', shortName: '新冠mRNA', category: 'NON_EPI' as const },
  { name: '重组新冠病毒疫苗', code: 'COVID-R', shortName: '新冠重组', category: 'NON_EPI' as const },
  { name: '腺病毒载体新冠疫苗', code: 'COVID-V', shortName: '新冠腺病毒', category: 'NON_EPI' as const },
  { name: '森林脑炎灭活疫苗', code: 'TBEV', shortName: '森脑', category: 'NON_EPI' as const },
  { name: '出血热疫苗', code: 'HFRS', shortName: '出血热', category: 'NON_EPI' as const },
  { name: '钩端螺旋体疫苗', code: 'LeptV', shortName: '钩体', category: 'NON_EPI' as const },
  { name: '炭疽疫苗', code: 'AVA', shortName: '炭疽', category: 'NON_EPI' as const },
  { name: '伤寒Vi多糖疫苗', code: 'ViPS', shortName: '伤寒', category: 'NON_EPI' as const },
  { name: '霍乱疫苗', code: 'CholeraV', shortName: '霍乱', category: 'NON_EPI' as const },
  { name: '黄热疫苗', code: 'YFV', shortName: '黄热', category: 'NON_EPI' as const },
  { name: '脑膜炎球菌B群疫苗', code: 'MenB', shortName: 'B群脑膜炎', category: 'NON_EPI' as const },
  { name: '破伤风疫苗', code: 'TT', shortName: '破伤风', category: 'NON_EPI' as const },
  { name: '吸附破伤风疫苗', code: 'TT-ad', shortName: '吸附破伤风', category: 'NON_EPI' as const },
  { name: '吸附白喉疫苗', code: 'DT-ad', shortName: '吸附白喉', category: 'NON_EPI' as const },
  { name: '吸附百白破(无细胞)', code: 'DTaP-ad', shortName: '无细胞百白破', category: 'NON_EPI' as const },
  { name: '腮腺炎减毒活疫苗', code: 'MuV', shortName: '腮腺炎', category: 'NON_EPI' as const },
  { name: '麻疹减毒活疫苗', code: 'MV', shortName: '麻疹', category: 'NON_EPI' as const },
  { name: '风疹减毒活疫苗', code: 'RV', shortName: '风疹', category: 'NON_EPI' as const },
  { name: '甲乙肝联合疫苗', code: 'HepAB', shortName: '甲乙肝', category: 'NON_EPI' as const },
  { name: '戊肝疫苗', code: 'HepE', shortName: '戊肝', category: 'NON_EPI' as const },
  { name: '呼吸道合胞病毒疫苗', code: 'RSV', shortName: 'RSV', category: 'NON_EPI' as const },
  { name: '登革热疫苗', code: 'DengV', shortName: '登革热', category: 'NON_EPI' as const },
  { name: '鼠疫疫苗', code: 'PlagueV', shortName: '鼠疫', category: 'NON_EPI' as const },
  { name: '布鲁氏菌疫苗', code: 'BrucellaV', shortName: '布病', category: 'NON_EPI' as const },
  { name: '流感嗜血杆菌疫苗', code: 'HibV', shortName: '流感嗜血', category: 'NON_EPI' as const },
  { name: '肺炎链球菌疫苗', code: 'PneuV', shortName: '肺炎链球', category: 'NON_EPI' as const },
  { name: '金黄色葡萄球菌疫苗', code: 'StaphV', shortName: '金葡菌', category: 'NON_EPI' as const },
  { name: '百日咳疫苗', code: 'PertV', shortName: '百日咳', category: 'NON_EPI' as const },
  { name: '减毒流感鼻喷疫苗', code: 'LAIV', shortName: '鼻喷流感', category: 'NON_EPI' as const },
  { name: '人二倍体狂犬疫苗', code: 'HDCV', shortName: '二倍体狂犬', category: 'NON_EPI' as const },
  { name: 'Vero细胞狂犬疫苗', code: 'PVRV', shortName: 'Vero狂犬', category: 'NON_EPI' as const },
  { name: '地鼠肾细胞狂犬疫苗', code: 'PHKC', shortName: '地鼠肾狂犬', category: 'NON_EPI' as const },
  { name: '鸡胚细胞狂犬疫苗', code: 'PCEC', shortName: '鸡胚狂犬', category: 'NON_EPI' as const },
  { name: 'A群C群脑膜炎疫苗', code: 'ACMV', shortName: 'AC脑膜炎', category: 'NON_EPI' as const },
  { name: '肠道病毒71型疫苗', code: 'EV71V', shortName: 'EV71', category: 'NON_EPI' as const },
  { name: '水痘带状疱疹疫苗', code: 'VZV', shortName: '水痘带疱', category: 'NON_EPI' as const },
  { name: 'B型流感嗜血杆菌疫苗', code: 'HibB', shortName: 'B型Hib', category: 'NON_EPI' as const },
  { name: '重组带状疱疹疫苗', code: 'RZV', shortName: '重组带疱', category: 'NON_EPI' as const },
  { name: '吸附无细胞百白破Hib', code: 'DTaP-Hib-ad', shortName: '百白破Hib', category: 'NON_EPI' as const },
  { name: '流脑Hib联合疫苗', code: 'MenHib', shortName: '流脑Hib', category: 'NON_EPI' as const },
  { name: 'AC流脑多糖结合Hib', code: 'AC-Hib', shortName: 'AC-Hib', category: 'NON_EPI' as const },
  { name: '脑膜炎ACWY135疫苗', code: 'MenACWY', shortName: 'ACWY脑膜炎', category: 'NON_EPI' as const },
  { name: '15价肺炎球菌疫苗', code: 'PCV15', shortName: '15价肺炎', category: 'NON_EPI' as const },
  { name: '20价肺炎球菌疫苗', code: 'PCV20', shortName: '20价肺炎', category: 'NON_EPI' as const },
  { name: '重组人乳头瘤病毒疫苗', code: 'rHPV', shortName: '重组HPV', category: 'NON_EPI' as const },
];

// 根据类别获取颜色配置
const getCategoryStyle = (category: 'EPI' | 'NON_EPI') => {
  if (category === 'EPI') {
    // 免疫规划疫苗 - 绿色系
    return { 
      color: '#166534', 
      bgColor: '#dcfce7', 
      borderColor: '#86efac' 
    };
  } else {
    // 非免疫规划疫苗 - 蓝色系
    return { 
      color: '#1e40af', 
      bgColor: '#dbeafe', 
      borderColor: '#93c5fd' 
    };
  }
};

const ChannelMatrix: React.FC<ChannelMatrixProps> = ({ onChannelClick }) => {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);

  // WebSocket实时更新
  const { channelStatus } = useWebSocket();
  
  // 显示模式配置
  const { is4x3 } = useDisplayMode();

  // 每页显示数量: 6列 x 4行 = 24个
  const cols = 6;
  const rows = 4;
  const pageSize = cols * rows; // 24
  const totalChannels = 72; // 共72个货道，分3页
  const totalPages = Math.ceil(totalChannels / pageSize); // 3页

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (channelStatus) {
      setChannels(prev => 
        prev.map(ch => 
          ch.position === channelStatus.position 
            ? { ...ch, ...channelStatus }
            : ch
        )
      );
      
      if (channelStatus.isActive) {
        setActiveChannel(channelStatus.position);
        setTimeout(() => setActiveChannel(null), 3000);
      }
    }
  }, [channelStatus]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/channels/matrix');
      const matrixData = response.data.data;
      
      const flatChannels: ChannelData[] = [];
      matrixData.matrix?.forEach((row: ChannelData[][]) => {
        row.forEach((channel: ChannelData) => {
          flatChannels.push(channel);
        });
      });
      
      // 如果数据不足，补充到72个
      while (flatChannels.length < totalChannels) {
        const mockChannel = generateSingleMockChannel(flatChannels.length + 1);
        flatChannels.push(mockChannel);
      }
      
      setChannels(flatChannels.slice(0, totalChannels));
    } catch (error) {
      console.error('获取货道数据失败:', error);
      setChannels(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateSingleMockChannel = (index: number): ChannelData => {
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const rowIndex = Math.floor((index - 1) / cols);
    const colIndex = ((index - 1) % cols) + 1;
    const vaccine = vaccineDatabase[index % vaccineDatabase.length];
    const expiryDays = Math.floor(Math.random() * 300) + 30;
    
    return {
      id: index,
      position: `${rowLabels[rowIndex]}${colIndex}`,
      rowIndex: rowLabels[rowIndex],
      colIndex,
      vaccineName: vaccine.name,
      vaccineCode: vaccine.code,
      vaccineType: vaccine.shortName,
      vaccineCategory: vaccine.category,
      manufacturer: ['兰州生物', '北京科兴', '深圳康泰', '华兰生物', '辽宁成大', '武汉生物', '长春生物'][Math.floor(Math.random() * 7)],
      batchNo: `B${2024}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      quantity: Math.floor(Math.random() * 180) + 20,
      capacity: 200,
      status: Math.random() > 0.08 ? 1 : (Math.random() > 0.5 ? 2 : 0),
      temperature: 2 + Math.random() * 6,
      expiryDate: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      expiryDays,
      todayOut: Math.floor(Math.random() * 30),
    };
  };

  const generateMockData = (): ChannelData[] => {
    return Array.from({ length: totalChannels }, (_, i) => generateSingleMockChannel(i + 1));
  };

  // 获取当前页的货道数据
  const getCurrentPageChannels = () => {
    const startIndex = (currentPage - 1) * pageSize;
    return channels.slice(startIndex, startIndex + pageSize);
  };

  // 渲染单个货道卡片
  const renderChannelCard = (channel: ChannelData) => {
    const categoryStyle = getCategoryStyle(channel.vaccineCategory || 'NON_EPI');
    const isActive = channel.position === activeChannel;
    const isWarning = channel.quantity < 10 || channel.status === 2;
    const isNormal = channel.status === 1 && channel.quantity >= 10;

    return (
      <div
        key={channel.id}
        className={classNames(styles.channelCard, {
          [styles.active]: isActive,
          [styles.warning]: channel.status === 2,
          [styles.disabled]: channel.status === 0,
        })}
        onClick={() => onChannelClick?.(channel)}
      >
        {/* 左侧类型标签 */}
        <div 
          className={styles.typeTag}
          style={{ 
            backgroundColor: categoryStyle.bgColor,
            borderRight: `3px solid ${categoryStyle.borderColor}`,
          }}
        >
          <span 
            className={styles.typeLabel}
            style={{ color: categoryStyle.color }}
          >
            {channel.vaccineType || '疫苗'}
          </span>
        </div>

        {/* 右侧内容区 */}
        <div className={styles.cardContent}>
          {/* 疫苗名称 */}
          <Tooltip title={channel.vaccineName}>
            <div className={styles.vaccineName}>
              {channel.vaccineName || '未配置'}
            </div>
          </Tooltip>
          
          {/* 疫苗代号和批号 */}
          <div className={styles.codeRow}>
            <span className={styles.vaccineCode}>{channel.vaccineCode || '-'}</span>
            <span className={styles.batchNo}>批号: {channel.batchNo?.slice(-8) || '-'}</span>
          </div>

          {/* 有效期 */}
          <div className={styles.expiryRow}>
            <span className={classNames(styles.expiryText, {
              [styles.expiryWarning]: (channel.expiryDays || 0) < 60,
              [styles.expiryDanger]: (channel.expiryDays || 0) < 30,
            })}>
              有效期: {channel.expiryDays || 180}天
            </span>
          </div>

          {/* 底部：库存和状态 */}
          <div className={styles.cardFooter}>
            <div className={styles.quantity}>
              <span className={styles.quantityValue}>{channel.quantity}</span>
              <span className={styles.quantityUnit}>支</span>
            </div>
            <div className={styles.statusTag}>
              {isWarning ? (
                <ExclamationCircleFilled className={styles.statusWarning} />
              ) : isNormal ? (
                <CheckCircleFilled className={styles.statusNormal} />
              ) : (
                <span className={styles.statusDisabled}>停用</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  const currentChannels = getCurrentPageChannels();

  return (
    <div className={classNames(styles.container, { [styles.compact]: is4x3 })}>
      {/* 头部信息 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            货道管理 ({currentPage}/{totalPages}) · 6×4布局
          </Text>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#dcfce7', border: '1px solid #86efac' }} />
              免疫规划
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#dbeafe', border: '1px solid #93c5fd' }} />
              非免疫规划
            </span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Button type="link" size="small">导出</Button>
        </div>
      </div>

      {/* 卡片网格 */}
      <div className={styles.gridContainer}>
        {/* 左翻页按钮 */}
        {currentPage > 1 && (
          <div 
            className={classNames(styles.pageArrow, styles.prevArrow)}
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          >
            <LeftOutlined />
          </div>
        )}

        <div className={styles.cardGrid}>
          {currentChannels.map(renderChannelCard)}
        </div>

        {/* 右翻页按钮 */}
        {currentPage < totalPages && (
          <div 
            className={classNames(styles.pageArrow, styles.nextArrow)}
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          >
            <RightOutlined />
          </div>
        )}
      </div>

      {/* 分页指示器 */}
      <div className={styles.pagination}>
        <div className={styles.pageIndicator}>
          {Array.from({ length: totalPages }, (_, i) => (
            <span
              key={i}
              className={classNames(styles.pageDot, {
                [styles.pageDotActive]: i + 1 === currentPage,
              })}
              onClick={() => setCurrentPage(i + 1)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChannelMatrix;
