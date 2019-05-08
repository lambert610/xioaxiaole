
  //主逻辑控住类  
class homeView extends ui.UI.homeViewUI implements UIBase{
        //定义UI类型
       type:UIType = UIType.homeView;
       public static instance:homeView;
       private fisrthang=1;
       private firstlie=1;
      
        constructor(arr:Array<number>){
          
            
            super();
            this.hang.on(Laya.Event.CLICK,this,this.hangclick);
            this.lie.on(Laya.Event.CLICK,this,this.lieclick);
            this.init(arr);
            homeView.instance=this;
        }
/*-----------------------------初始化数据,创建各种控制器--------------------------------------*/
        	public evm:ElementViewManage; 	
            private levm: LevelReqViewManage;
            private mapc:MapControl;
            private pvm:PropViewManage;
            public hangclick(){
                if(this.fisrthang==1&&this.firstlie==1){
                    this.hang.scale(0.8,0.8);
                    this.hang.skin="home/zhenghangactive.png"
                    this.fisrthang=0;
                }else{
                    this.hang.scale(1,1);
                     this.hang.skin="home/zhenghang.png"
                     this.fisrthang=1;
                }
           
            }
            public lieclick(){
                 if(this.firstlie==1&&this.fisrthang==1){
                    this.lie.scale(0.8,0.8);
                    this.lie.skin="home/zhenglieactive.png"
                    this.firstlie=0;
                }else{
                    this.lie.scale(1,1);
                     this.lie.skin="home/zhenglie.png"
                     this.firstlie=1;
                }
            }
        public init(arr):void{
            
            GameData.initData();   //初始化数据
            let levelData:JSON = Laya.loader.getRes("res/data/l1.json");// 获取地图配置的json;
            
            
            MapDataParse.createMapData(arr);//创建地图数据
            LevelGameDataParse.parseLevelGameData(levelData); //初始化游戏数据
            ElementTypeParse.creatElementTypeData(levelData["element"]);//初始化元素类型;
            GameData.unmapnum=arr.length;
            

            // 测试加载资源
          
            
            // 创建地图
            this.mapc = new MapControl();
            this.mapc.createElementAllMap();
            
            
            //创建背景图
            var gbg:GameBackGround = new GameBackGround();
            this.addChild(gbg);
            gbg.changeBackground();


            //创建关卡数据
            let lec:Laya.Sprite = new Laya.Sprite();
            this.addChild(lec);
            this.levm = new LevelReqViewManage(lec);
            this.levm.createCurrentLevelReq();

            //道具管理器
            // let pvmc:Laya.Sprite = new Laya.Sprite();
            // this.addChild(pvmc);
            // this.pvm = new PropViewManage(pvmc);

            //基本元素管理器
            let cc:Laya.Image = new Laya.Image();
            this.addChild( cc );
            this.evm = new ElementViewManage(cc);
            this.evm.showAllElements();
           
            
    

            // /注册侦听器，即指定事件由哪个对象的哪个方法来接收
            //下面监听的事件 只能有evm 来触发..
            this.evm.on(ElementViewManageEvent.REMOVE_ANIMATION_OVER,this,this.removeAndOver);
            this.evm.on(ElementViewManageEvent.TAP_TWO_ELEMENT,this,this.viewTouchTap);
            this.evm.on(ElementViewManageEvent.UPDATE_MAP,this,this.createNewElement);
            this.evm.on(ElementViewManageEvent.UPDATE_VIEW_OVER,this,this.checkOtherElementLink);
            this.evm.on(ElementViewManageEvent.USE_PROP_CLICK,this,this.usePropClick);
           
        }
        /*-----------------------------携带道具被点击--------------------------------------*/
        private usePropClick(evt:ElementViewManageEvent)
        {
            PropLogic.useProp(PropViewManage.propType,evt.propToElementLocation);//操作数据
            this.pvm.useProp();
            this.removeAndOver(null);  //播放删除动画
        }
    
        /*-----------------------------元素置换动画播放结束，数据操作，并播放删除动画--------------------------------------*/
        /**
         * 即将删除的元素移动结束
         * 开始搜索删除数据，并且播放删除动画
         * 更新地图数据
         * 更新其他数据
         */
        private removeAndOver(evt:ElementViewManageEvent){
            // console.log("需要消除的元素ID"+LinkLogic.lines);
            let len:number = LinkLogic.lines.length;
            let rel:boolean;
            for (let i = 0; i < len; i++){
                let l:number = LinkLogic.lines[i].length;
                let eType:string ="";
                // let flag = false;
                for (let t = 0; t < l; t++){
                    eType = GameData.elements[LinkLogic.lines[i][t]].type;
                    rel =this.levm.haveReqType(eType);

                    //有相同关卡类型,运动到指定位置
                    if(rel ){ //取消了曲线动画	
                        let p:Laya.Point =this.levm.getPointByType(eType);
                        GameData.levelReq.changeReqNum(eType,1);
                        this.levm.update();
                        this.evm.playReqRemoveAn(LinkLogic.lines[i][t],p.x,p.y);
			            
                        
                    }else{
                        this.evm.playRemoveAni(LinkLogic.lines[i][t]);
                        
                    }				
                }
            }
            
        GameData.stopclick=false;
        }
        /*-----------------------------视图管理器中存在两个被tap的元素，进行判断--------------------------------------*/
        private viewTouchTap(evt:ElementViewManageEvent){
            let  rel:boolean = LinkLogic.canMove(evt.ele1,evt.ele2);
            if(rel)
            {
                //判断两个位置移动后是否可以消除
                let lineRel:boolean = LinkLogic.isHaveLineByIndex(GameData.elements[evt.ele1].location,GameData.elements[evt.ele2].location);
                    // console.log("移动后是否能消除",lineRel);
                    //执行移动
                    if(lineRel){
                        //移动，然后消除
                        // console.log("消除动画");
                        this.evm.changeLocationWithScaleOrBack(evt.ele1,evt.ele2);
                        //更新步数
                        if(GameData.stepNum>=1){
                            GameData.stepNum--;
                            this.levm.updateStep();	
                        }
                       
                    }else{
                        this.evm.changeLocationWithScaleOrBack(evt.ele1,evt.ele2,true);
                        GameData.stopclick=true;
                        
                    }
            }
            else
            {
                this.evm.setNewElementFocus(evt.ele2);//两个元素从空间位置上不可交换，设置新焦点
                GameData.stopclick=false;
            }
        }
        /*^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^*/  



        /*---------------------------所有元素都删除完毕后，创建新元素，并刷新视图---------------------------------*/
        private createNewElement(evt:ElementViewManageEvent)
        {
            //多次调用 问题 通过计数器 解决
            // console.log("所有元素都删除完毕后，创建新元素，并刷新视图");
            this.mapc.updateMapLocation();
            this.evm.updateMapData();
        }
        /*^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^*/
         	/*-----------------------------删除动画完成后，检测地图中是否存在剩余可消除元素--------------------------------------*/
	 private checkOtherElementLink(evt:ElementViewManageEvent){
		 if(LinkLogic.isHaveLine()&&!GameData.isgameover)//地图中还有可消除的元素
		 {
			 this.removeAndOver(null);
		 }
		 else
		 {
			//  console.log("检查是否有可消除元素!");
			 if(!LinkLogic.isNextHaveLine()){	
				while(true){
					// console.log("执行乱序");
					LinkLogic.changeOrder();//乱序
                    if (!LinkLogic.isHaveLine()&&LinkLogic.isNextHaveLine())//没有可消除的元素了且存在移动一步可消除的项目
                    {
                       this.evm.updateOrder();
					   break;
                    }
				}
			 }
		 }
		 console.log("所有动画逻辑结束");
        //检测步数和关卡数
       	 this.isGameOver();
	 }
 	/*^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^*/

     	/*-----------------------------检测当前游戏是否GameOver------------------------------*/
		
		private isGameOver()
		{
			console.log("过关元素是否清空",GameData.levelReq.isClear());
			
				if(GameData.stepNum==0) //步数为0，GameOver
				{
                    GameData.isgameover=true;
					if(GameData.levelReq.isClear())
					{
						let gameover=ui.gameover.instance;
                        this.addChild(gameover);
                        gameover.loser.visible=false;
                        gameover.gameover.visible=false;
					}
					else
					{
						let gameover=ui.gameover.instance;
                        this.addChild(gameover);
                        gameover.resulttext.visible=false;
                        gameover.win.visible=false;

					}
				}
				else{
					if(GameData.levelReq.isClear())  //所有关卡数量为0，GameOver
					{	GameData.isgameover=true;
                        let gameover=ui.gameover.instance;
                        this.addChild(gameover);
                        gameover.loser.visible=false;
                        gameover.gameover.visible=false;
                       switch (GameData.curstage){
                           case 1:
                           if(20-GameData.stepNum<GameData.first){
                           let step=20-GameData.stepNum;
                           let msg='{ "head":"update",  "name":'+'"'+GameData.nickname+'"'+',"stage":"stage1", "step":'+'"'+step+'"'+' }';
                           net.Server.self.sendmsg(msg);
                           }else{
                               break;
                           }
                           break;
                           case 2:
                            if(20-GameData.stepNum<GameData.second){
                            let step=20-GameData.stepNum;
                           let msg='{ "head":"update",   "name":'+'"'+GameData.nickname+'"'+',"stage":"stage2", "step":'+'"'+step+'"'+' }';
                           net.Server.self.sendmsg(msg);
                           }else{
                               break;
                           }
                           break;
                           case 3:
                            if(20-GameData.stepNum<GameData.third){
                           let step=20-GameData.stepNum;
                           let msg='{ "head":"update", "name":'+'"'+GameData.nickname+'"'+', "stage":"stage3", "step":'+'"'+step+'"'+' }';
                           net.Server.self.sendmsg(msg);
                           }else{
                               break;
                           }
                           break;
                       }
						
					}
				}
			
		}
		/*^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^*/
        public open(obj: any[], call: Laya.Handler)
        {
            //初始化UI，数据加载    
            //加载完后调用回调显示UI
            if(call) {
                call.run();
                call = null;
            }
        }

        public  close()
        {   
            ui.select.self.uiManager.close();
            this.destroy();
            Laya.stage.addChild(ui.home.instance);                 
        }

        public hide()
        {

        }

        //回调后会调用show，用于显示UI时的一些表现
        public show()
        {

        }

}