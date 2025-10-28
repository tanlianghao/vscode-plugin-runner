let widgetBuilder = function(className: string, fileName: string) {
	return `
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:xdragon/common/navigator.dart';
import 'package:xdragon/pages/clue_entry/clue_search.page.dart';
import 'package:xdragon/widgets/app_bar.dart';
import '${fileName}';
import 'package:xltheme_ui/xltheme_ui.dart';

class ${className}ListWidget extends StatefulWidget {
  const ${className}ListWidget({Key? key}) : super(key: key);

  @override
  State<${className}ListWidget> createState() => _${className}ListWidgetState();
}

class _${className}ListWidgetState extends State<${className}ListWidget> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: XLAppBar(title: Text('')),
        body: BlocProvider<${className}Cubit>(
          create: (context) => ${className}Cubit(),
          child: Builder(builder: (ctx) {
            final cubit = ctx.read<${className}Cubit>();
            return BlocBuilder<${className}Cubit, ${className}State>(
              builder: (context, state) {
                if (state.isLoading) {
                  return Spinning();
                }

                if (state.isError) {
                  return buildNetWorkError(() {
                    // TODO: 重试逻辑
                  });
                }

                return Column(
                  children: [
                    Expanded(
                        child: PullDownList<T>(
                      renderItem: (data, index) {
                        return buildItem(data, index);
                      },
                      emptyWidget: buildNoData(),
                      onBlocRequest: cubit.onBlocRequest,
                      firstRefresh: true,
                      keepAlive: true,
                    ))
                  ],
                );
              },
            );
          }),
        ));
  }

  Widget buildItem(T data, int index) {
    throw UnimplementedError();
  }

  // 如果支持搜索
  Widget trailingBuilder() {
    return GestureDetector(
      onTap: () {
        // TODO: 通用搜索页面，需要自定义请重新编码
        XLNavigator.delegateState?.pushNamed(XLPageClueSearch().path,
            arguments: XLPageClueSearch().createArguments(
                hintText: "请输入手机号",
                searchDelegate: ${className}ListSearchDelegate(historyStoreKey: 'reception_search_delegate')));
      },
      child: LargeIcon(
        child: Image(image: AssetImage('assets/home/icon-sous2.png')),
      ),
    );
  }
}

class ${className}ListSearchDelegate extends XdragonSearchDelegate {
  ${className}ListSearchDelegate({required String historyStoreKey}) : super(historyStoreKey: historyStoreKey);

  @override
  Widget buildResults(BuildContext context, [Map? ext]) {
    // TODO: 实现自定义搜索结果页面
    throw UnimplementedError();
  }
}
  `;
};

let pulldownListCodeBuilder = function(className: string, fileName: string) {
  return `
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:xdragon/common/navigator.dart';
import 'package:xdragon/widgets/app_bar.dart';
import '${fileName}';
import 'package:xltheme_ui/xltheme_ui.dart';

class ${className}Page extends StatefulWidget {
  const ${className}Page({Key? key, this.initialIndex}) : super(key: key);
  final String? initialIndex;

  @override
  State<${className}Page> createState() => _${className}PageState();
}

class _${className}PageState extends State<${className}Page> with SingleTickerProviderStateMixin {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: XLAppBar(title: 'TODO: 标题'),
        body: BlocProvider<${className}Cubit>(
          create: (context) => ${className}Cubit(vsync: this, initialIndex: widget.initialIndex)..initState(),
          child: Builder(builder: (ctx) {
            final cubit = ctx.read<${className}Cubit>();
            return BlocBuilder<${className}Cubit, ${className}State>(
              builder: (context, state) {
                return Column(
                  children: [
                    XLTabBar(
                      tabs: cubit.tabs.map((e) => Text(e)).toList(),
                      controller: cubit.tabController,
                      labelStyle: context.mainStyles.textStyle.body1,
                      unselectedLabelStyle: context.mainStyles.textStyle.body1.copyWith(fontWeight: FontWeight.normal),
                      labelPadding: EdgeInsets.all(0),
                    ),
                    Expanded(
                        child: TabBarView(
                      controller: cubit.tabController,
                      children: [
                        ...cubit.tabs
                            .map((e) => PullDownList<T>(
                                  renderItem: (data, index) {
                                    return buildItem(data, index);
                                  },
                                  pullDownListController: cubit.pullDownListControllers[e],
                                  firstRefreshWidget: Container(
                                    child: Center(
                                      child: Spinning(
                                        text: '正在加载...',
                                      ),
                                    ),
                                  ),
                                  emptyWidget: buildNoData(onReload: cubit.callRefresh),
                                  onBlocRequest: cubit.onBlocRequest,
                                  keepAlive: true,
                                ))
                            .toList()
                      ],
                    ))
                  ],
                );
              },
            );
          }),
        ));
  }

  Widget buildItem(T data, int index) {
    throw UnimplementedError();
  }
}
  `;
};

export { widgetBuilder, pulldownListCodeBuilder };