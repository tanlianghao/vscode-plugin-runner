let cubitCodeBuilder = function(blocName: string, fileName: string) {
  return `
import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:xdragon/utils/error_handler.dart';
import 'package:xltheme_ui/pull_down/index.dart';

part '${fileName}_state.dart';

class ${blocName}Cubit extends Cubit<${blocName}State> {
  ${blocName}Cubit() : super(${blocName}State());

  PullDownListController pullDownListController = PullDownListController();
  final pageSize = 10;

  Future<void> onBlocRequest(int page) async {
    try {
      emit(state.copy(isLoading: true, isError: false));
      // Simulate network request or data fetching
      final data = await Future.wait([]);

      emit(state.copy(isLoading: false));

      pullDownListController.finishRefresh(PullDownResponse(hasMore: data.length == pageSize, list: data));
    } catch (e, s) {
      if (!isClosed) {
        emit(state.copy(isError: true, isLoading: false));
      }
      pullDownListController.finishRefresh(PullDownResponse(hasError: true, list: []));
      handlerError(e, s);
    }
  }
}
  `;
};

let stateCodeBuilder = function(blocName: string, fileName: string) {
  return `
part of '${fileName}_cubit.dart';

class ${blocName}State extends Equatable {
  const ${blocName}State({
    this.isLoading = false,
    this.isError = false,
  });

  final bool isLoading;
  final bool isError;

  ${blocName}State copy({
    bool? isLoading,
    bool? isError,
  }) {
    return ${blocName}State(
      isLoading: isLoading ?? this.isLoading,
      isError: isError ?? this.isError,
    );
  }

  @override
  List<Object?> get props => [isLoading, isError];
}
  `;
};

let pulldownListCubitCodeBuilder = function(blocName: string, fileName: string) {
  return `
import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:xdragon/utils/error_handler.dart';
import 'package:xltheme_ui/pull_down/index.dart';

part '${fileName}_state.dart';

class ${blocName}Cubit extends Cubit<${blocName}State> {
  ${blocName}Cubit({required this.vsync, this.initialIndex}) : super(${blocName}State());

  final TickerProvider vsync;
  final String? initialIndex;

  final pageSize = 10;
  final List<String> tabs = ['Tab 1', 'Tab 2', 'Tab 3'];

  late TabController tabController;
  Map<String, PullDownListController> pullDownListControllers = {};
  int initialTabIndex = 0;

  void initState() {
    if (initialIndex != null) {
      initialTabIndex = int.tryParse(initialIndex!) ?? 0;
    }
    tabController = TabController(length: tabs.length, vsync: vsync, initialIndex: initialTabIndex);

    for (var tab in tabs) {
      pullDownListControllers[tab] = PullDownListController();
    }
  }

  Future<void> onBlocRequest(int page) async {
    final pullDownListController = pullDownListControllers[tabs[tabController.index]];
    try {
      // TODO: Simulate network request or data fetching
      final data = await Future.wait([]);

      pullDownListController?.finishRefresh(PullDownResponse(hasMore: data.length == pageSize, list: data));
    } catch (e, s) {
      pullDownListController?.finishRefresh(PullDownResponse(hasError: true, list: []));
      handlerError(e, s);
    }
  }

  void callRefresh() {
    final pullDownListController = pullDownListControllers[tabs[tabController.index]];
    pullDownListController?.callRefreshByBloc((page) => onBlocRequest(page));
  }
}
  `;
};

let pulldownListStateCodeBuilder = function(blocName: string, fileName: string) {
  return `
part of '${fileName}_cubit.dart';

class ${blocName}State extends Equatable {
  const ${blocName}State({
    this.isLoading = false,
    this.isError = false,
  });
final bool isLoading;
  final bool isError;

  ${blocName}State copy({
    bool? isLoading,
    bool? isError,
  }) {
    return ${blocName}State(
      isLoading: isLoading ?? this.isLoading,
      isError: isError ?? this.isError,
    );
  }

  @override
  List<Object?> get props => [isLoading, isError];
}
  `;
};

let filterPulldownCubitCodeBuilder = function(blocName: string, fileName: string) {
  return `
import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:xdragon/pages/user_record/modules/record_filter.dart';
import 'package:xdragon/pages/user_record/modules/record_list_data_handle.dart';
import 'package:xdragon/utils/error_handler.dart';
import 'package:xltheme_ui/pull_down/index.dart';

part '${fileName}_state.dart';

class ${blocName}Cubit extends Cubit<${blocName}State> {
  ${blocName}Cubit({required this.vsync, this.initialIndex}) : super(${blocName}State());

  final TickerProvider vsync;
  final String? initialIndex;

  final pageSize = 10;
  final List<String> tabs = ['Tab 1', 'Tab 2', 'Tab 3']; // TODO: Define your tabs

  late TabController tabController;
  Map<String, PullDownListController> pullDownListControllers = {};
  Map<String, CommonFilterController> filterController = {};

  final String _tag = "${blocName}Cubit";

  int initialTabIndex = 0;

  void initState() {
    if (initialIndex != null) {
      initialTabIndex = int.tryParse(initialIndex!) ?? 0;
    }
    tabController = TabController(length: tabs.length, vsync: vsync, initialIndex: initialTabIndex);

    for (var tab in tabs) {
      pullDownListControllers[tab] = PullDownListController();
      filterController[tab] = CommonFilterController();
    }
    asyncGetDataHandler();
  }

  void asyncGetDataHandler() async {
    try {
      emit(state.copy(isLoading: true, isError: false));
      await Future.delayed(Duration(seconds: 1)); // TODO: Simulate network delay, fetch initial filter data
      Map<String, List<RecordListFilterData>> filterParams = {};

      for (var tab in tabs) {
        // TODO: Fetch filter data for each tab, here is a sample structure
        filterParams[tab] = [
          RecordListFilterData.fromJson({
            "name": "客户状态",
            "value": "",
            "key": "customer_status",
            "visible": 1,
            "type": "multiSelect",
            "children": [
              {
                "name": "线索阶段",
                "value": "",
                "key": "customer_status_clue_stage",
                "visible": 0,
                "type": "multiSelect",
                "children": [
                  {"name": "待清洗", "value": "待清洗", "key": "willfollow", "children": []}
                ]
              },
            ]
          })
        ];
      }
      emit(state.copy(isLoading: false, filterListMap: filterParams));
    } catch (e, s) {
      emit(state.copy(isLoading: false, isError: true));
    }
  }

  Future<void> onBlocRequest(int page) async {
    final pullDownListController = pullDownListControllers[tabs[tabController.index]];
    try {
      // TODO: Simulate network request or data fetching
      final data = await Future.wait([]);

      pullDownListController?.finishRefresh(PullDownResponse(hasMore: data.length == pageSize, list: data));
    } catch (e, s) {
      pullDownListController?.finishRefresh(PullDownResponse(hasError: true, list: []));
      handlerError(e, s);
    }
  }

  void callRefresh() {
    final pullDownListController = pullDownListControllers[tabs[tabController.index]];
    pullDownListController?.callRefreshByBloc((page) => onBlocRequest(page));
  }

  void onTapFilter(bool isSelected, RecordListFilterData? filterData) {
    final currentTab = tabs[tabController.index];
    final showFilter = Map<String, bool>.from(state.showFilter);

    emit(state.copy(showFilter: showFilter..[currentTab] = isSelected));
  }

  void confirmFilterHandle(Map<String, String> data) {
    final currentTab = tabs[tabController.index];
    final showFilter = Map<String, bool>.from(state.showFilter);
    emit(state.copy(showFilter: showFilter..[currentTab] = false));
    throw UnimplementedError();
  }
}
  `;
};

let filterPulldownStateCodeBuilder = function(blocName: string, fileName: string) {
  return `
part of '${fileName}_cubit.dart';

class ${blocName}State extends Equatable {
  const ${blocName}State({
    this.isLoading = false,
    this.isError = false,
    this.filterListMap,
    this.showFilter = const {},
  });
  final bool isLoading;
  final bool isError;
  final Map<String, bool> showFilter;
  final Map<String, List<RecordListFilterData>>? filterListMap;

  ${blocName}State copy({
    bool? isLoading,
    bool? isError,
    Map<String, List<RecordListFilterData>>? filterListMap,
    Map<String, bool>? showFilter,
  }) {
    return ${blocName}State(
      isLoading: isLoading ?? this.isLoading,
      isError: isError ?? this.isError,
      filterListMap: filterListMap ?? this.filterListMap,
      showFilter: showFilter ?? this.showFilter,
    );
  }

  @override
  List<Object?> get props => [isLoading, isError, filterListMap, showFilter];
}

  `;
};

export { cubitCodeBuilder, stateCodeBuilder, pulldownListCubitCodeBuilder, pulldownListStateCodeBuilder, filterPulldownCubitCodeBuilder, filterPulldownStateCodeBuilder };